import { monthlyPrincipalAndInterest } from "@/lib/calculations";

export interface MortgageInputs {
  homePrice: number;
  downPaymentPercent: number; // 0-100
  interestRatePercent: number; // annual, 0-100
  loanTermYears: number;
  startMonth: number; // 1-12
  startYear: number;

  propertyTaxAnnual: number;
  homeInsuranceAnnual: number;
  hoaMonthly: number;
  pmiAnnualPercent: number; // % of loan amount/year, only charged while LTV > 78%

  extraMonthlyPayment: number;
  extraOneTimePayment: number;
  extraOneTimeMonth: number; // 1-indexed month (from loan start) the lump sum is applied
  biweekly: boolean; // approximate accelerated bi-weekly payoff
}

export function getDefaultMortgageInputs(): MortgageInputs {
  const now = new Date();
  return {
    homePrice: 350000,
    downPaymentPercent: 20,
    interestRatePercent: 6.5,
    loanTermYears: 30,
    startMonth: now.getMonth() + 1,
    startYear: now.getFullYear(),
    propertyTaxAnnual: 4200,
    homeInsuranceAnnual: 1500,
    hoaMonthly: 0,
    pmiAnnualPercent: 0.5,
    extraMonthlyPayment: 0,
    extraOneTimePayment: 0,
    extraOneTimeMonth: 1,
    biweekly: false,
  };
}

export interface MortgageScheduleMonth {
  monthIndex: number; // 1-indexed month number since loan start
  calendarYear: number;
  calendarMonth: number; // 1-12
  payment: number; // P&I + extra applied this month
  principal: number;
  extraPrincipal: number;
  interest: number;
  pmi: number;
  balance: number;
  cumulativeInterest: number;
  cumulativePrincipal: number;
}

export interface MortgageScheduleYear {
  loanYear: number; // 1-indexed year of the loan (not calendar year)
  calendarYearStart: number;
  principalPaid: number;
  interestPaid: number;
  pmiPaid: number;
  endingBalance: number;
}

export interface MortgageSummary {
  downPaymentAmount: number;
  loanAmount: number;
  monthlyPI: number;
  monthlyTax: number;
  monthlyInsurance: number;
  monthlyHoa: number;
  monthlyPmi: number; // PMI in month 1 (0 if not applicable)
  totalMonthlyPayment: number; // PITI + PMI at loan start
  scheduleMonths: MortgageScheduleMonth[];
  scheduleYears: MortgageScheduleYear[];
  payoffMonthIndex: number;
  payoffDate: { year: number; month: number };
  totalInterestPaid: number;
  totalPmiPaid: number;
  totalExtraPrincipalPaid: number;
  pmiDropoffMonthIndex: number | null;
  pmiDropoffDate: { year: number; month: number } | null;
}

/**
 * Full month-by-month amortization for a mortgage, including PMI
 * (required when the down payment is under 20%, auto-cancelled once
 * the balance reaches 78% of the original home price per the
 * Homeowners Protection Act) and optional extra principal payments
 * (recurring monthly, a one-time lump sum, and/or an accelerated
 * bi-weekly schedule).
 *
 * Bi-weekly is approximated as an extra 1/12th of the P&I payment
 * applied every month — equivalent in total to 26 half-payments/year
 * (13 full monthly payments) without simulating actual 14-day periods.
 */
export function computeMortgage(inputs: MortgageInputs): MortgageSummary {
  const downPaymentAmount = inputs.homePrice * (inputs.downPaymentPercent / 100);
  const loanAmount = Math.max(inputs.homePrice - downPaymentAmount, 0);
  const monthlyPI = monthlyPrincipalAndInterest(
    loanAmount,
    inputs.interestRatePercent,
    inputs.loanTermYears
  );
  const monthlyTax = inputs.propertyTaxAnnual / 12;
  const monthlyInsurance = inputs.homeInsuranceAnnual / 12;
  const monthlyHoa = inputs.hoaMonthly;
  const monthlyRate = inputs.interestRatePercent / 100 / 12;

  const pmiCancelThreshold = inputs.homePrice * 0.78;
  const pmiRequired = inputs.downPaymentPercent < 20 && inputs.pmiAnnualPercent > 0;
  const pmiFull = pmiRequired ? (loanAmount * (inputs.pmiAnnualPercent / 100)) / 12 : 0;
  const biweeklyExtraMonthly = inputs.biweekly ? monthlyPI / 12 : 0;

  const scheduleMonths: MortgageScheduleMonth[] = [];
  let balance = loanAmount;
  let cumulativeInterest = 0;
  let cumulativePrincipal = 0;
  let totalPmiPaid = 0;
  let totalExtraPrincipalPaid = 0;
  let pmiDropoffMonthIndex: number | null = null;
  let calendarMonth = inputs.startMonth;
  let calendarYear = inputs.startYear;
  const maxMonths = Math.max(Math.round(inputs.loanTermYears * 12), 0);

  for (let i = 1; i <= maxMonths && balance > 0.005; i++) {
    const interest = balance * monthlyRate;
    let principal = monthlyPI - interest;
    let extra = inputs.extraMonthlyPayment + biweeklyExtraMonthly;
    if (i === inputs.extraOneTimeMonth) extra += inputs.extraOneTimePayment;
    if (principal < 0) principal = 0;

    if (principal + extra > balance) {
      if (principal >= balance) {
        principal = balance;
        extra = 0;
      } else {
        extra = balance - principal;
      }
    }

    const pmiActive = balance > pmiCancelThreshold && pmiFull > 0;
    const pmi = pmiActive ? pmiFull : 0;
    if (pmi > 0) totalPmiPaid += pmi;
    if (!pmiActive && pmiFull > 0 && pmiDropoffMonthIndex === null) {
      pmiDropoffMonthIndex = i;
    }

    balance -= principal + extra;
    cumulativeInterest += interest;
    cumulativePrincipal += principal + extra;
    totalExtraPrincipalPaid += extra;

    scheduleMonths.push({
      monthIndex: i,
      calendarYear,
      calendarMonth,
      payment: interest + principal + extra,
      principal,
      extraPrincipal: extra,
      interest,
      pmi,
      balance: Math.max(balance, 0),
      cumulativeInterest,
      cumulativePrincipal,
    });

    calendarMonth++;
    if (calendarMonth > 12) {
      calendarMonth = 1;
      calendarYear++;
    }
  }

  const scheduleYears: MortgageScheduleYear[] = [];
  for (let i = 0; i < scheduleMonths.length; i += 12) {
    const chunk = scheduleMonths.slice(i, i + 12);
    const firstOfChunk = chunk[0];
    const lastOfChunk = chunk[chunk.length - 1];
    if (!firstOfChunk || !lastOfChunk) continue;
    scheduleYears.push({
      loanYear: scheduleYears.length + 1,
      calendarYearStart: firstOfChunk.calendarYear,
      principalPaid: chunk.reduce((s, m) => s + m.principal + m.extraPrincipal, 0),
      interestPaid: chunk.reduce((s, m) => s + m.interest, 0),
      pmiPaid: chunk.reduce((s, m) => s + m.pmi, 0),
      endingBalance: lastOfChunk.balance,
    });
  }

  const lastMonth = scheduleMonths[scheduleMonths.length - 1];
  const pmiDropoffMonth =
    pmiDropoffMonthIndex !== null ? scheduleMonths[pmiDropoffMonthIndex - 1] : undefined;
  const pmiDropoffDate = pmiDropoffMonth
    ? { year: pmiDropoffMonth.calendarYear, month: pmiDropoffMonth.calendarMonth }
    : null;

  return {
    downPaymentAmount,
    loanAmount,
    monthlyPI,
    monthlyTax,
    monthlyInsurance,
    monthlyHoa,
    monthlyPmi: pmiFull,
    totalMonthlyPayment: monthlyPI + monthlyTax + monthlyInsurance + monthlyHoa + pmiFull,
    scheduleMonths,
    scheduleYears,
    payoffMonthIndex: lastMonth?.monthIndex ?? 0,
    payoffDate: lastMonth
      ? { year: lastMonth.calendarYear, month: lastMonth.calendarMonth }
      : { year: inputs.startYear, month: inputs.startMonth },
    totalInterestPaid: cumulativeInterest,
    totalPmiPaid,
    totalExtraPrincipalPaid,
    pmiDropoffMonthIndex,
    pmiDropoffDate,
  };
}

export interface ExtraPaymentImpact {
  interestSaved: number;
  monthsSaved: number;
  payoffDate: { year: number; month: number };
  baselinePayoffDate: { year: number; month: number };
}

/**
 * Compares a schedule against the same loan with no extra/bi-weekly
 * payments, to show how much interest and time those payments save.
 */
export function compareToBaseline(inputs: MortgageInputs): ExtraPaymentImpact {
  const withExtra = computeMortgage(inputs);
  const baseline = computeMortgage({
    ...inputs,
    extraMonthlyPayment: 0,
    extraOneTimePayment: 0,
    biweekly: false,
  });

  return {
    interestSaved: Math.max(baseline.totalInterestPaid - withExtra.totalInterestPaid, 0),
    monthsSaved: Math.max(baseline.payoffMonthIndex - withExtra.payoffMonthIndex, 0),
    payoffDate: withExtra.payoffDate,
    baselinePayoffDate: baseline.payoffDate,
  };
}

export const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];
