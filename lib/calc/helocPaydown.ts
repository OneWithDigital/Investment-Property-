import { monthlyPrincipalAndInterest } from "@/lib/calculations";

/**
 * HELOC "velocity banking" / chunking calculator.
 *
 * Methodology modeled here (matches how the strategy is actually taught,
 * e.g. in the popular "pay off your mortgage with a HELOC" walkthroughs):
 *   1. The Chunk — draw a lump sum against the HELOC and apply it as a
 *      one-time extra principal payment on the mortgage.
 *   2. The Flow — every dollar of monthly discretionary cash flow (income
 *      left over after the mortgage payment and normal living expenses)
 *      is applied to pay the HELOC balance back down, since HELOC interest
 *      compounds daily on whatever balance remains rather than being fixed
 *      like the mortgage's amortization schedule.
 *   3. The Repeat — once the HELOC is paid back to zero, draw another
 *      chunk against the mortgage and start over, until the mortgage is
 *      gone. Whatever's left on the HELOC is then paid off using the same
 *      monthly cash flow, now with the old mortgage payment added to it.
 *
 * We simulate that month-by-month, alongside two baselines, so the actual
 * lever driving the result is visible rather than assumed:
 *   - "Minimum payments" — do nothing extra; pure amortization to zero.
 *   - "Extra principal payments" — apply the same monthly discretionary
 *     cash flow directly to mortgage principal every month, no HELOC
 *     involved at all.
 *   - "HELOC chunking" — the strategy above.
 *
 * The well-documented finding (and the reason this tool shows all three
 * side by side instead of just the HELOC number) is that the payoff speed
 * mostly comes from the discretionary cash flow itself, not from routing
 * it through a HELOC — chunking often lands within a rounding error of
 * "extra principal payments," and can lose to it outright once the HELOC
 * carries a higher rate than the mortgage.
 */

export interface HelocPaydownInputs {
  mortgageBalance: number;
  mortgageRatePercent: number; // annual
  mortgageRemainingTermYears: number; // used only to derive the current P&I payment
  monthlyDiscretionaryIncome: number; // cash available each month beyond the mortgage payment + living expenses
  helocRatePercent: number; // annual, typically variable
  helocLimit: number;
  chunkPercentOfLimit: number; // 0-100, safety margin below the full limit per draw
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
  yearly: StrategyMonth[]; // one snapshot per 12 months (year-end), plus a final snapshot at payoff
}

export interface HelocPaydownResult {
  monthlyPayment: number;
  minimumPayments: StrategyResult;
  extraPrincipal: StrategyResult;
  helocChunking: StrategyResult;
}

const MAX_MONTHS = 600; // 50-year hard stop so bad inputs can't spin forever

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
  if (yearly.length === 0 || yearly[yearly.length - 1]?.month !== month) {
    yearly.push({ month, mortgageBalance: Math.max(b, 0), helocBalance: 0, cumulativeInterest: totalInterest });
  }

  return {
    monthsToMortgageFreedom: monthsToFree,
    monthsToTotalFreedom: monthsToFree,
    totalInterestPaid: totalInterest,
    totalMortgageInterest: totalInterest,
    totalHelocInterest: 0,
    chunkCount: 0,
    hitSimulationCap: monthsToFree === null,
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
  if (yearly.length === 0 || yearly[yearly.length - 1]?.month !== month) {
    yearly.push({ month, mortgageBalance: Math.max(b, 0), helocBalance: 0, cumulativeInterest: totalInterest });
  }

  return {
    monthsToMortgageFreedom: monthsToFree,
    monthsToTotalFreedom: monthsToFree,
    totalInterestPaid: totalInterest,
    totalMortgageInterest: totalInterest,
    totalHelocInterest: 0,
    chunkCount: 0,
    hitSimulationCap: monthsToFree === null,
    yearly,
  };
}

/** HELOC chunking / velocity banking simulation. */
function simulateHelocChunking(
  balance: number,
  mortgageRatePercent: number,
  payment: number,
  discretionaryMonthly: number,
  helocRatePercent: number,
  helocLimit: number,
  chunkPercentOfLimit: number
): StrategyResult {
  const mortgageMonthlyRate = mortgageRatePercent / 100 / 12;
  const helocMonthlyRate = helocRatePercent / 100 / 12;
  const chunkTarget = Math.max(helocLimit, 0) * (Math.max(Math.min(chunkPercentOfLimit, 100), 0) / 100);

  let mortgageBalance = balance;
  let helocBalance = 0;
  let mortgageInterest = 0;
  let helocInterest = 0;
  let chunkCount = 0;
  let month = 0;
  let mortgageFreeMonth: number | null = null;
  let totalFreeMonth: number | null = null;
  const yearly: StrategyMonth[] = [];

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

    // Regular mortgage payment continues as normal.
    if (mortgageBalance > 0.005) {
      const interest = mortgageBalance * mortgageMonthlyRate;
      let principal = payment - interest;
      if (principal > mortgageBalance) principal = mortgageBalance;
      if (principal < 0) principal = 0;
      mortgageBalance -= principal;
      mortgageInterest += interest;
    }

    // HELOC interest accrues on whatever's outstanding.
    if (helocBalance > 0.005) {
      const interest = helocBalance * helocMonthlyRate;
      helocBalance += interest;
      helocInterest += interest;
    }

    // Discretionary cash flow flushes the HELOC first (the "Flow" step);
    // once mortgage is paid off, that freed-up payment joins the flow too.
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
      // HELOC is empty — draw the next chunk against the mortgage.
      drawChunk();
    }

    if (mortgageFreeMonth === null && mortgageBalance <= 0.005) {
      mortgageFreeMonth = month;
    }

    snapshotEvery12(month, mortgageBalance, helocBalance, mortgageInterest + helocInterest, yearly);
  }

  if (mortgageBalance <= 0.005 && helocBalance <= 0.005) {
    totalFreeMonth = month;
  }
  if (yearly.length === 0 || yearly[yearly.length - 1]?.month !== month) {
    yearly.push({
      month,
      mortgageBalance: Math.max(mortgageBalance, 0),
      helocBalance: Math.max(helocBalance, 0),
      cumulativeInterest: mortgageInterest + helocInterest,
    });
  }

  return {
    monthsToMortgageFreedom: mortgageFreeMonth,
    monthsToTotalFreedom: totalFreeMonth,
    totalInterestPaid: mortgageInterest + helocInterest,
    totalMortgageInterest: mortgageInterest,
    totalHelocInterest: helocInterest,
    chunkCount,
    hitSimulationCap: totalFreeMonth === null,
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
    inputs.chunkPercentOfLimit
  );

  return {
    monthlyPayment: payment,
    minimumPayments,
    extraPrincipal,
    helocChunking,
  };
}

export const DEFAULT_HELOC_INPUTS: HelocPaydownInputs = {
  mortgageBalance: 300000,
  mortgageRatePercent: 6.75,
  mortgageRemainingTermYears: 27,
  monthlyDiscretionaryIncome: 800,
  helocRatePercent: 9.5,
  helocLimit: 50000,
  chunkPercentOfLimit: 90,
};
