import { monthlyPrincipalAndInterest } from "@/lib/calculations";

/**
 * HELOC "velocity banking" / chunking calculator.
 *
 * Methodology modeled here (matches how the strategy is actually taught,
 * e.g. in the popular "pay off your mortgage with a HELOC" walkthroughs):
 *   1. The Chunk — draw a lump sum against the HELOC and apply it as a
 *      one-time extra principal payment on the mortgage.
 *   2. The Flow — every dollar of monthly discretionary cash flow (income
 *      left over after normal living expenses) is applied to pay the
 *      HELOC balance back down, since HELOC interest compounds daily on
 *      whatever balance remains rather than being fixed like the
 *      mortgage's amortization schedule.
 *   3. The Repeat — once the HELOC is paid back to zero, draw another
 *      chunk against the mortgage and start over, until the mortgage is
 *      gone. Whatever's left on the HELOC is then paid off using the same
 *      monthly cash flow, now with the old mortgage payment added to it.
 *
 * Two real-world variants of "the Flow" step exist, and they carry
 * meaningfully different risk profiles, so this module models both as a
 * `cashFlowStyle` toggle instead of picking one silently:
 *
 *   - "conservative": the mortgage payment is still paid normally out of
 *     a regular checking account, untouched by the HELOC. Only the
 *     leftover monthly discretionary surplus is swept into the HELOC as
 *     a single lump paydown. Lower risk, easier to manage, but you don't
 *     get the full benefit the strategy is built on.
 *   - "full-pass-through": paycheck deposits go straight into the HELOC
 *     and the mortgage payment itself is funded out of that same pool
 *     (i.e. drawn from the HELOC), with the discretionary surplus applied
 *     in two installments a month rather than one lump sum — approximating
 *     biweekly paychecks landing sooner and holding the average balance
 *     (and therefore accrued interest) lower. This is the version the
 *     "velocity banking" pitches actually describe. It also means there is
 *     no separate cash buffer left outside the HELOC, so this module
 *     tracks whether the plan would ever push the HELOC balance over its
 *     limit and flags that explicitly rather than pretending it can't
 *     happen.
 *
 * We simulate both, plus two baselines, so the actual lever driving the
 * result is visible rather than assumed:
 *   - "Minimum payments" — do nothing extra; pure amortization to zero.
 *   - "Extra principal payments" — apply the same monthly discretionary
 *     cash flow directly to mortgage principal every month, no HELOC
 *     involved at all.
 *   - "HELOC chunking" — one of the two styles above.
 *
 * The well-documented finding (and the reason this tool shows all three
 * side by side instead of just the HELOC number) is that the payoff speed
 * mostly comes from the discretionary cash flow itself, not from routing
 * it through a HELOC — chunking often lands within a rounding error of
 * "extra principal payments," and can lose to it outright once the HELOC
 * carries a higher rate than the mortgage.
 *
 * This is a monthly-granularity model with a simplified semi-monthly
 * approximation for the "full-pass-through" timing effect — not a
 * day-by-day interest engine. It's an educational estimate, not a
 * substitute for a lender's actual HELOC terms and amortization figures.
 */

export type CashFlowStyle = "conservative" | "full-pass-through";

export interface HelocPaydownInputs {
  mortgageBalance: number;
  mortgageRatePercent: number; // annual
  mortgageRemainingTermYears: number; // used only to derive the current P&I payment
  monthlyDiscretionaryIncome: number; // cash available each month beyond the mortgage payment + living expenses
  helocRatePercent: number; // annual, typically variable
  helocLimit: number;
  helocBufferAmount: number; // dollars of the limit deliberately left undrawn
  cashFlowStyle: CashFlowStyle;
}

export interface StrategyMonth {
  month: number;
  mortgageBalance: number;
  helocBalance: number;
  cumulativeInterest: number;
}

export interface StrategyResult {
  monthsToMortgageFreedom: number | null; // month the mortgage balance hits 0
  monthsToTotalFreedom: number | null; // month all balances (mortgage + HELOC, if any) hit 0
  totalInterestPaid: number;
  totalMortgageInterest: number;
  totalHelocInterest: number;
  chunkCount: number;
  hitSimulationCap: boolean;
  everExceededHelocLimit: boolean;
  firstExceededMonth: number | null;
  yearly: StrategyMonth[]; // one snapshot per 12 months (year-end), plus a final snapshot at payoff
}

export interface HelocPaydownResult {
  monthlyPayment: number;
  minimumPayments: StrategyResult;
  extraPrincipal: StrategyResult;
  helocChunking: StrategyResult;
}

const MAX_MONTHS = 600; // 50-year hard stop so bad inputs can't spin forever

/**
 * Suggested amount of a HELOC's limit to deliberately never draw against,
 * so a chunking plan always keeps room to absorb an irregular expense (or,
 * under "full-pass-through", to still fund next month's mortgage payment).
 * Not a substitute for a lender's own underwriting guidance — a simple,
 * conservative rule of thumb: never plan against the last 10% of the line,
 * and reserve at least a couple months of the mortgage payment on top of
 * that (three months under full-pass-through, since that style routes
 * every dollar — including the mortgage payment — through the HELOC and
 * leaves no separate cash cushion).
 */
export function recommendedHelocBuffer(
  helocLimit: number,
  monthlyMortgagePayment: number,
  cashFlowStyle: CashFlowStyle
): number {
  if (helocLimit <= 0) return 0;
  const monthsOfPaymentToReserve = cashFlowStyle === "full-pass-through" ? 3 : 2;
  const floorBuffer = helocLimit * 0.1;
  const paymentBasedBuffer = monthlyMortgagePayment * monthsOfPaymentToReserve;
  const recommended = Math.max(floorBuffer, paymentBasedBuffer);
  // Don't recommend reserving so much of the line that there's nothing left to chunk with.
  return Math.min(recommended, helocLimit * 0.6);
}

function snapshotEvery12(
  month: number,
  mortgageBalance: number,
  helocBalance: number,
  cumulativeInterest: number,
  yearly: StrategyMonth[]
) {
  if (month % 12 === 0) {
    yearly.push({
      month,
      mortgageBalance: Math.max(mortgageBalance, 0),
      helocBalance: Math.max(helocBalance, 0),
      cumulativeInterest,
    });
  }
}

function finalizeYearly(yearly: StrategyMonth[], month: number, mortgageBalance: number, helocBalance: number, cumulativeInterest: number) {
  if (yearly.length === 0 || yearly[yearly.length - 1]?.month !== month) {
    yearly.push({
      month,
      mortgageBalance: Math.max(mortgageBalance, 0),
      helocBalance: Math.max(helocBalance, 0),
      cumulativeInterest,
    });
  }
}

/** Baseline: standard amortization, minimum payment only, no extra principal. */
function simulateMinimumPayments(
  balance: number,
  ratePercent: number,
  payment: number
): StrategyResult {
  const monthlyRate = ratePercent / 100 / 12;
  let b = balance;
  let totalInterest = 0;
  let month = 0;
  let monthsToFree: number | null = null;
  const yearly: StrategyMonth[] = [];

  while (b > 0.005 && month < MAX_MONTHS) {
    month++;
    const interest = b * monthlyRate;
    let principal = payment - interest;
    if (principal > b) principal = b;
    if (principal <= 0) break; // payment doesn't cover interest — will never amortize
    b -= principal;
    totalInterest += interest;
    snapshotEvery12(month, b, 0, totalInterest, yearly);
  }
  if (b <= 0.005) monthsToFree = month;
  finalizeYearly(yearly, month, b, 0, totalInterest);

  return {
    monthsToMortgageFreedom: monthsToFree,
    monthsToTotalFreedom: monthsToFree,
    totalInterestPaid: totalInterest,
    totalMortgageInterest: totalInterest,
    totalHelocInterest: 0,
    chunkCount: 0,
    hitSimulationCap: monthsToFree === null,
    everExceededHelocLimit: false,
    firstExceededMonth: null,
    yearly,
  };
}

/** Baseline: regular payment + all discretionary cash flow applied as extra principal each month. */
function simulateExtraPrincipal(
  balance: number,
  ratePercent: number,
  payment: number,
  extraMonthly: number
): StrategyResult {
  const monthlyRate = ratePercent / 100 / 12;
  let b = balance;
  let totalInterest = 0;
  let month = 0;
  let monthsToFree: number | null = null;
  const yearly: StrategyMonth[] = [];

  while (b > 0.005 && month < MAX_MONTHS) {
    month++;
    const interest = b * monthlyRate;
    let principal = payment - interest + extraMonthly;
    if (principal > b) principal = b;
    if (principal <= 0) break;
    b -= principal;
    totalInterest += interest;
    snapshotEvery12(month, b, 0, totalInterest, yearly);
  }
  if (b <= 0.005) monthsToFree = month;
  finalizeYearly(yearly, month, b, 0, totalInterest);

  return {
    monthsToMortgageFreedom: monthsToFree,
    monthsToTotalFreedom: monthsToFree,
    totalInterestPaid: totalInterest,
    totalMortgageInterest: totalInterest,
    totalHelocInterest: 0,
    chunkCount: 0,
    hitSimulationCap: monthsToFree === null,
    everExceededHelocLimit: false,
    firstExceededMonth: null,
    yearly,
  };
}

/** HELOC chunking / velocity banking simulation, in either cash-flow style. */
function simulateHelocChunking(
  balance: number,
  mortgageRatePercent: number,
  payment: number,
  discretionaryMonthly: number,
  helocRatePercent: number,
  helocLimit: number,
  bufferAmount: number,
  cashFlowStyle: CashFlowStyle
): StrategyResult {
  const mortgageMonthlyRate = mortgageRatePercent / 100 / 12;
  const helocMonthlyRate = helocRatePercent / 100 / 12;
  const chunkTarget = Math.max(helocLimit - Math.max(bufferAmount, 0), 0);

  let mortgageBalance = balance;
  let helocBalance = 0;
  let mortgageInterest = 0;
  let helocInterest = 0;
  let chunkCount = 0;
  let month = 0;
  let mortgageFreeMonth: number | null = null;
  let totalFreeMonth: number | null = null;
  let everExceededHelocLimit = false;
  let firstExceededMonth: number | null = null;
  const yearly: StrategyMonth[] = [];

  const checkLimit = () => {
    if (helocLimit > 0 && helocBalance > helocLimit + 0.005) {
      everExceededHelocLimit = true;
      if (firstExceededMonth === null) firstExceededMonth = month;
    }
  };

  const drawChunk = () => {
    if (mortgageBalance <= 0.005 || helocLimit <= 0 || chunkTarget <= 0) return;
    const room = helocLimit - helocBalance;
    const draw = Math.min(chunkTarget, room, mortgageBalance);
    if (draw > 0.005) {
      mortgageBalance -= draw;
      helocBalance += draw;
      chunkCount++;
    }
  };

  // Draw the first chunk immediately — that's the whole point of the strategy.
  drawChunk();

  while ((mortgageBalance > 0.005 || helocBalance > 0.005) && month < MAX_MONTHS) {
    month++;

    if (cashFlowStyle === "conservative") {
      // Mortgage payment is paid normally, outside the HELOC.
      if (mortgageBalance > 0.005) {
        const interest = mortgageBalance * mortgageMonthlyRate;
        let principal = payment - interest;
        if (principal > mortgageBalance) principal = mortgageBalance;
        if (principal < 0) principal = 0;
        mortgageBalance -= principal;
        mortgageInterest += interest;
      }

      if (helocBalance > 0.005) {
        const interest = helocBalance * helocMonthlyRate;
        helocBalance += interest;
        helocInterest += interest;
      }

      const availableCash = discretionaryMonthly + (mortgageBalance <= 0.005 ? payment : 0);
      if (helocBalance > 0.005) {
        const paydown = Math.min(availableCash, helocBalance);
        helocBalance -= paydown;
        const leftover = availableCash - paydown;
        if (leftover > 0.005 && mortgageBalance > 0.005) {
          const extra = Math.min(leftover, mortgageBalance);
          mortgageBalance -= extra;
        }
      } else if (mortgageBalance > 0.005) {
        drawChunk();
        checkLimit();
      }

      if (mortgageFreeMonth === null && mortgageBalance <= 0.005) mortgageFreeMonth = month;
    } else {
      // Full pass-through: the mortgage payment itself is funded from the
      // HELOC pool (paycheck deposits and bill payments both run through
      // it), and the discretionary surplus is applied in two installments
      // to approximate biweekly paychecks landing sooner than a single
      // month-end sweep.
      if (mortgageBalance > 0.005) {
        const interest = mortgageBalance * mortgageMonthlyRate;
        let principal = payment - interest;
        if (principal > mortgageBalance) principal = mortgageBalance;
        if (principal < 0) principal = 0;
        mortgageBalance -= principal;
        mortgageInterest += interest;
        helocBalance += payment; // the mortgage bill was funded out of the HELOC pool
        checkLimit();
      }
      if (mortgageFreeMonth === null && mortgageBalance <= 0.005) mortgageFreeMonth = month;

      if (helocBalance <= 0.005 && mortgageBalance > 0.005) {
        drawChunk();
        checkLimit();
      }

      // The deposit side of the pool is a fixed household characteristic —
      // income minus non-mortgage expenses — regardless of whether the
      // mortgage is still being drawn out of it: while the mortgage is
      // active this nets against the `payment` draw above (leaving the
      // same discretionaryMonthly reduction as the conservative style);
      // once it's gone, the same deposit flows straight through to payoff.
      const monthlyFlow = discretionaryMonthly + payment;
      const halfFlow = monthlyFlow / 2;
      for (let sub = 0; sub < 2; sub++) {
        if (helocBalance > 0.005) {
          const subInterest = helocBalance * (helocMonthlyRate / 2);
          helocBalance += subInterest;
          helocInterest += subInterest;
        }
        if (helocBalance > 0.005) {
          const paydown = Math.min(halfFlow, helocBalance);
          helocBalance -= paydown;
          const leftover = halfFlow - paydown;
          if (leftover > 0.005 && mortgageBalance > 0.005) {
            const extra = Math.min(leftover, mortgageBalance);
            mortgageBalance -= extra;
          }
        } else if (mortgageBalance > 0.005) {
          drawChunk();
          checkLimit();
        }
      }
    }

    snapshotEvery12(month, mortgageBalance, helocBalance, mortgageInterest + helocInterest, yearly);
  }

  if (mortgageBalance <= 0.005 && helocBalance <= 0.005) {
    totalFreeMonth = month;
  }
  finalizeYearly(yearly, month, mortgageBalance, helocBalance, mortgageInterest + helocInterest);

  return {
    monthsToMortgageFreedom: mortgageFreeMonth,
    monthsToTotalFreedom: totalFreeMonth,
    totalInterestPaid: mortgageInterest + helocInterest,
    totalMortgageInterest: mortgageInterest,
    totalHelocInterest: helocInterest,
    chunkCount,
    hitSimulationCap: totalFreeMonth === null,
    everExceededHelocLimit,
    firstExceededMonth,
    yearly,
  };
}

export function simulateHelocPaydown(inputs: HelocPaydownInputs): HelocPaydownResult {
  const payment = monthlyPrincipalAndInterest(
    inputs.mortgageBalance,
    inputs.mortgageRatePercent,
    Math.max(inputs.mortgageRemainingTermYears, 1)
  );

  const minimumPayments = simulateMinimumPayments(
    inputs.mortgageBalance,
    inputs.mortgageRatePercent,
    payment
  );
  const extraPrincipal = simulateExtraPrincipal(
    inputs.mortgageBalance,
    inputs.mortgageRatePercent,
    payment,
    Math.max(inputs.monthlyDiscretionaryIncome, 0)
  );
  const helocChunking = simulateHelocChunking(
    inputs.mortgageBalance,
    inputs.mortgageRatePercent,
    payment,
    Math.max(inputs.monthlyDiscretionaryIncome, 0),
    inputs.helocRatePercent,
    Math.max(inputs.helocLimit, 0),
    inputs.helocBufferAmount,
    inputs.cashFlowStyle
  );

  return {
    monthlyPayment: payment,
    minimumPayments,
    extraPrincipal,
    helocChunking,
  };
}

const DEFAULT_MORTGAGE_BALANCE = 300000;
const DEFAULT_MORTGAGE_RATE = 6.75;
const DEFAULT_MORTGAGE_TERM_YEARS = 27;
const DEFAULT_HELOC_LIMIT = 50000;

export const DEFAULT_HELOC_INPUTS: HelocPaydownInputs = {
  mortgageBalance: DEFAULT_MORTGAGE_BALANCE,
  mortgageRatePercent: DEFAULT_MORTGAGE_RATE,
  mortgageRemainingTermYears: DEFAULT_MORTGAGE_TERM_YEARS,
  monthlyDiscretionaryIncome: 800,
  helocRatePercent: 9.5,
  helocLimit: DEFAULT_HELOC_LIMIT,
  helocBufferAmount: recommendedHelocBuffer(
    DEFAULT_HELOC_LIMIT,
    monthlyPrincipalAndInterest(DEFAULT_MORTGAGE_BALANCE, DEFAULT_MORTGAGE_RATE, DEFAULT_MORTGAGE_TERM_YEARS),
    "conservative"
  ),
  cashFlowStyle: "conservative",
};
