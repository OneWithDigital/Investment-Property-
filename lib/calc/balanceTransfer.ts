// Simulates rotating credit-card debt across a sequence of 0%-APR balance
// transfer promotions: pay down principal interest-free while a promo is
// active, then transfer whatever's left to the next card before the promo
// expires. Tracks transfer fees, annual fees, any interest incurred, and
// generates "start planning your next transfer" reminder dates.

function addMonths(dateStr: string, months: number): string {
  const d = new Date(`${dateStr}T00:00:00Z`);
  d.setUTCMonth(d.getUTCMonth() + months);
  return d.toISOString().slice(0, 10);
}

function addDays(dateStr: string, days: number): string {
  const d = new Date(`${dateStr}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

export interface BalanceTransferCardInput {
  id: string;
  name: string;
  creditLimit: number;
  transferFeePercent: number; // typically 3-5%
  promoAprPercent: number; // usually 0
  promoMonths: number;
  postPromoAprPercent: number; // rate that applies if the balance is still there after the promo
  annualFee: number;
}

export interface BalanceTransferInputs {
  startingBalance: number;
  monthlyPayment: number;
  startDate: string; // YYYY-MM-DD, date of the first transfer
  reminderLeadDays: number; // how far ahead of a promo's expiration to remind
  cards: BalanceTransferCardInput[];
}

export interface CardStage {
  stageNumber: number;
  cardId: string;
  cardName: string;
  transferDate: string;
  incomingBalance: number; // principal moved onto this card, before its fee
  transferFee: number;
  startingCardBalance: number; // incomingBalance + transferFee
  exceededCreditLimit: boolean;
  uncoveredAmount: number; // portion that didn't fit under this card's limit
  promoMonths: number;
  promoEndDate: string;
  reminderDate: string;
  monthsOnPromo: number;
  paidOffDuringPromo: boolean;
  annualFeesCharged: number;
  postPromoMonths: number; // months spent amortizing at the regular APR (last card only)
  postPromoInterestPaid: number;
  endingBalance: number; // balance carried into the next stage (0 if resolved)
}

export interface ReminderEvent {
  date: string;
  title: string;
  detail: string;
}

export interface BalanceTransferResult {
  stages: CardStage[];
  fullyPaidOff: boolean;
  payoffDate: string | null;
  totalMonths: number;
  totalTransferFees: number;
  totalAnnualFees: number;
  totalInterestPaid: number;
  totalCostOfPlan: number;
  remainingBalance: number;
  suggestedMinPayoffPayment: number;
  warnings: string[];
  reminders: ReminderEvent[];
}

const MAX_AMORTIZATION_MONTHS = 600; // 50-year safety valve against infinite/runaway loops
const MAX_PROMO_MONTHS = 360; // 30 years — well beyond any real promo, blocks pathological inputs
export const MAX_BALANCE_TRANSFER_CARDS = 12;
const MAX_CARDS = MAX_BALANCE_TRANSFER_CARDS;
const MAX_DOLLAR_VALUE = 100_000_000; // guards against Infinity/overflow from pasted garbage

function clamp(value: unknown, min: number, max: number, fallback = min): number {
  const n = typeof value === "number" && Number.isFinite(value) ? value : fallback;
  return Math.min(Math.max(n, min), max);
}

function isValidIsoDate(value: unknown): value is string {
  return typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(value));
}

/**
 * All inputs here can originate from a public-facing form, so every field
 * is clamped to a sane finite range before it drives any loop or arithmetic
 * — this is what keeps a stray huge/negative/NaN value from hanging the
 * tab (unbounded loop) or producing nonsense results (divide-by-zero,
 * negative rates counting as free money) rather than a normal failure.
 */
function sanitizeInputs(inputs: BalanceTransferInputs): BalanceTransferInputs {
  return {
    startingBalance: clamp(inputs.startingBalance, 0, MAX_DOLLAR_VALUE, 0),
    monthlyPayment: clamp(inputs.monthlyPayment, 0, MAX_DOLLAR_VALUE, 0),
    startDate: isValidIsoDate(inputs.startDate)
      ? inputs.startDate
      : new Date().toISOString().slice(0, 10),
    reminderLeadDays: Math.round(clamp(inputs.reminderLeadDays, 0, 3650, 30)),
    cards: (Array.isArray(inputs.cards) ? inputs.cards : [])
      .slice(0, MAX_CARDS)
      .map((c, i) => ({
        id: typeof c.id === "string" && c.id ? c.id : `card-${i}`,
        name: typeof c.name === "string" && c.name.trim() ? c.name.slice(0, 80) : `Card ${i + 1}`,
        creditLimit: clamp(c.creditLimit, 0, MAX_DOLLAR_VALUE, 0),
        transferFeePercent: clamp(c.transferFeePercent, 0, 100, 0),
        promoAprPercent: clamp(c.promoAprPercent, 0, 100, 0),
        promoMonths: Math.round(clamp(c.promoMonths, 0, MAX_PROMO_MONTHS, 0)),
        postPromoAprPercent: clamp(c.postPromoAprPercent, 0, 100, 0),
        annualFee: clamp(c.annualFee, 0, MAX_DOLLAR_VALUE, 0),
      })),
  };
}

export function simulateBalanceTransferPlan(
  rawInputs: BalanceTransferInputs
): BalanceTransferResult {
  const inputs = sanitizeInputs(rawInputs);
  const warnings: string[] = [];
  const reminders: ReminderEvent[] = [];
  const stages: CardStage[] = [];

  let remaining = inputs.startingBalance;
  let currentDate = inputs.startDate;
  let totalTransferFees = 0;
  let totalAnnualFees = 0;
  let totalInterestPaid = 0;
  let totalMonths = 0;
  let payoffDate: string | null = null;
  let fullyPaidOff = false;

  const cards = inputs.cards.filter((c) => c.promoMonths > 0);

  for (let i = 0; i < cards.length && remaining > 0.005; i++) {
    const card = cards[i];
    if (!card) continue;
    const isLastCard = i === cards.length - 1;
    const transferDate = currentDate;
    const feeRate = card.transferFeePercent / 100;

    let incomingBalance = remaining;
    let uncoveredAmount = 0;
    let exceededCreditLimit = false;
    if (card.creditLimit > 0) {
      const maxPrincipalGivenLimit = card.creditLimit / (1 + feeRate);
      if (incomingBalance > maxPrincipalGivenLimit) {
        uncoveredAmount = incomingBalance - maxPrincipalGivenLimit;
        incomingBalance = Math.max(maxPrincipalGivenLimit, 0);
        exceededCreditLimit = true;
      }
    }

    const transferFee = incomingBalance * feeRate;
    totalTransferFees += transferFee;
    let cardBalance = incomingBalance + transferFee;
    const startingCardBalance = cardBalance;

    const promoEndDate = addMonths(transferDate, card.promoMonths);
    const reminderDate = addDays(promoEndDate, -inputs.reminderLeadDays);

    const monthlyPromoRate = card.promoAprPercent / 100 / 12;
    let monthsOnPromo = 0;
    let paidOffDuringPromo = false;

    for (let m = 0; m < card.promoMonths && cardBalance > 0.005; m++) {
      const interest = cardBalance * monthlyPromoRate;
      totalInterestPaid += interest;
      if (inputs.monthlyPayment <= interest && interest > 0) {
        warnings.push(
          `Your monthly payment doesn't cover ${card.name}'s promo-period interest — the balance won't shrink. Increase your monthly payment.`
        );
      }
      cardBalance = cardBalance + interest - inputs.monthlyPayment;
      if (cardBalance < 0) cardBalance = 0;
      monthsOnPromo++;
      totalMonths++;
      if (cardBalance <= 0.005) {
        paidOffDuringPromo = true;
        break;
      }
    }

    const yearsHeld = Math.max(1, Math.ceil(monthsOnPromo / 12));
    const annualFeesCharged = card.annualFee * yearsHeld;
    totalAnnualFees += annualFeesCharged;

    let postPromoMonths = 0;
    let postPromoInterestPaid = 0;
    let endingBalance = cardBalance;

    if (paidOffDuringPromo) {
      currentDate = addMonths(transferDate, monthsOnPromo);
      remaining = 0;
      payoffDate = currentDate;
      fullyPaidOff = true;
      endingBalance = 0;
    } else if (isLastCard) {
      reminders.push({
        date: reminderDate,
        title: `${card.name}'s 0% promo is ending soon`,
        detail: `This is your last card in the rotation. Its promo ends ${promoEndDate} — after that, any remaining balance accrues interest at ${card.postPromoAprPercent}% APR. Line up another balance-transfer offer now if you want to keep the rate at 0%.`,
      });

      const monthlyPostRate = card.postPromoAprPercent / 100 / 12;
      let bal = cardBalance;
      let months = 0;
      while (bal > 0.005 && months < MAX_AMORTIZATION_MONTHS) {
        const interest = bal * monthlyPostRate;
        if (inputs.monthlyPayment <= interest) {
          warnings.push(
            `At $${inputs.monthlyPayment.toFixed(0)}/month, the remaining balance on ${card.name} never pays off at its ${card.postPromoAprPercent}% post-promo APR — increase your payment.`
          );
          break;
        }
        postPromoInterestPaid += interest;
        bal = bal + interest - inputs.monthlyPayment;
        if (bal < 0) bal = 0;
        months++;
      }
      postPromoMonths = months;
      totalInterestPaid += postPromoInterestPaid;
      totalMonths += months;
      endingBalance = bal;
      remaining = bal + uncoveredAmount;
      currentDate = addMonths(promoEndDate, months);
      if (remaining <= 0.005) {
        fullyPaidOff = true;
        payoffDate = currentDate;
        endingBalance = 0;
        remaining = 0;
      }
    } else {
      remaining = cardBalance + uncoveredAmount;
      currentDate = promoEndDate;
      reminders.push({
        date: reminderDate,
        title: `Plan your next balance transfer off ${card.name}`,
        detail: `${card.name}'s 0% promo ends ${promoEndDate}. Line up and submit your next balance transfer now so it completes before interest kicks in. Estimated balance to move: $${cardBalance.toFixed(0)}.`,
      });
    }

    if (exceededCreditLimit) {
      warnings.push(
        `${card.name}'s credit limit couldn't cover the full balance — about $${uncoveredAmount.toFixed(0)} was left uncovered by this plan.`
      );
    }

    stages.push({
      stageNumber: i + 1,
      cardId: card.id,
      cardName: card.name,
      transferDate,
      incomingBalance,
      transferFee,
      startingCardBalance,
      exceededCreditLimit,
      uncoveredAmount,
      promoMonths: card.promoMonths,
      promoEndDate,
      reminderDate,
      monthsOnPromo,
      paidOffDuringPromo,
      annualFeesCharged,
      postPromoMonths,
      postPromoInterestPaid,
      endingBalance,
    });

    if (fullyPaidOff) break;
  }

  if (!fullyPaidOff && remaining > 0.005) {
    warnings.push(
      `You've run out of cards in the rotation with about $${remaining.toFixed(0)} still remaining. Add another card or increase your monthly payment.`
    );
  }

  const totalPromoMonths = cards.reduce((sum, c) => sum + c.promoMonths, 0);
  const firstFeeRate = (cards[0]?.transferFeePercent ?? 0) / 100;
  const suggestedMinPayoffPayment =
    totalPromoMonths > 0
      ? (inputs.startingBalance * (1 + firstFeeRate)) / totalPromoMonths
      : 0;

  const totalCostOfPlan = totalTransferFees + totalAnnualFees + totalInterestPaid;

  return {
    stages,
    fullyPaidOff,
    payoffDate,
    totalMonths,
    totalTransferFees,
    totalAnnualFees,
    totalInterestPaid,
    totalCostOfPlan,
    remainingBalance: fullyPaidOff ? 0 : remaining,
    suggestedMinPayoffPayment,
    warnings,
    reminders,
  };
}

export const DEFAULT_BALANCE_TRANSFER_CARDS: BalanceTransferCardInput[] = [
  {
    id: "card-1",
    name: "Card 1",
    creditLimit: 10000,
    transferFeePercent: 3,
    promoAprPercent: 0,
    promoMonths: 15,
    postPromoAprPercent: 24.99,
    annualFee: 0,
  },
  {
    id: "card-2",
    name: "Card 2",
    creditLimit: 8000,
    transferFeePercent: 4,
    promoAprPercent: 0,
    promoMonths: 18,
    postPromoAprPercent: 22.99,
    annualFee: 0,
  },
  {
    id: "card-3",
    name: "Card 3",
    creditLimit: 8000,
    transferFeePercent: 5,
    promoAprPercent: 0,
    promoMonths: 12,
    postPromoAprPercent: 21.99,
    annualFee: 0,
  },
];

export const DEFAULT_BALANCE_TRANSFER_INPUTS: BalanceTransferInputs = {
  startingBalance: 15000,
  monthlyPayment: 600,
  startDate: new Date().toISOString().slice(0, 10),
  reminderLeadDays: 45,
  cards: DEFAULT_BALANCE_TRANSFER_CARDS,
};
