import type {
  AmortizationYear,
  CalculationResult,
  ProjectionYear,
  PropertyInputs,
} from "./types";

/**
 * Standard fixed-rate mortgage payment (principal + interest only).
 */
export function monthlyPrincipalAndInterest(
  loanAmount: number,
  annualInterestRatePercent: number,
  termYears: number
): number {
  const monthlyRate = annualInterestRatePercent / 100 / 12;
  const numPayments = termYears * 12;
  if (loanAmount <= 0) return 0;
  if (monthlyRate === 0) return loanAmount / numPayments;
  const factor = Math.pow(1 + monthlyRate, numPayments);
  return (loanAmount * (monthlyRate * factor)) / (factor - 1);
}

/**
 * Full amortization schedule, aggregated by year, for `years` years
 * (loan may run longer than the hold period; we only need the hold window).
 */
export function amortizationSchedule(
  loanAmount: number,
  annualInterestRatePercent: number,
  termYears: number,
  years: number
): AmortizationYear[] {
  const monthlyRate = annualInterestRatePercent / 100 / 12;
  const payment = monthlyPrincipalAndInterest(
    loanAmount,
    annualInterestRatePercent,
    termYears
  );
  const schedule: AmortizationYear[] = [];
  let balance = loanAmount;

  for (let year = 1; year <= years; year++) {
    const beginningBalance = balance;
    let principalPaid = 0;
    let interestPaid = 0;

    for (let m = 0; m < 12; m++) {
      if (balance <= 0) break;
      const interest = balance * monthlyRate;
      let principal = payment - interest;
      if (principal > balance) principal = balance;
      balance -= principal;
      principalPaid += principal;
      interestPaid += interest;
    }

    schedule.push({
      year,
      beginningBalance,
      principalPaid,
      interestPaid,
      endingBalance: Math.max(balance, 0),
    });
  }

  return schedule;
}

/**
 * Newton's-method IRR solver over an arbitrary cash-flow series.
 * cashFlows[0] is the initial outlay (negative), remaining entries are
 * subsequent period cash flows (last one should include exit proceeds).
 */
export function calculateIrr(cashFlows: number[]): number | null {
  if (cashFlows.length < 2) return null;

  const npv = (rate: number) =>
    cashFlows.reduce((sum, cf, t) => sum + cf / Math.pow(1 + rate, t), 0);

  const dNpv = (rate: number) =>
    cashFlows.reduce(
      (sum, cf, t) => sum + (t === 0 ? 0 : (-t * cf) / Math.pow(1 + rate, t + 1)),
      0
    );

  let rate = 0.1;
  for (let i = 0; i < 100; i++) {
    const value = npv(rate);
    const derivative = dNpv(rate);
    if (Math.abs(derivative) < 1e-10) break;
    const nextRate = rate - value / derivative;
    if (!Number.isFinite(nextRate)) break;
    if (Math.abs(nextRate - rate) < 1e-7) {
      rate = nextRate;
      break;
    }
    rate = nextRate;
  }

  if (!Number.isFinite(rate) || rate < -0.99 || rate > 10) {
    return null;
  }
  return rate * 100;
}

export function analyzeProperty(inputs: PropertyInputs): CalculationResult {
  const downPaymentAmount =
    inputs.purchasePrice * (inputs.downPaymentPercent / 100);
  const loanAmount = inputs.purchasePrice - downPaymentAmount;
  const closingCosts =
    inputs.purchasePrice * (inputs.closingCostPercent / 100);
  const loanPointsCost = loanAmount * (inputs.loanPointsPercent / 100);
  const totalCashInvested =
    downPaymentAmount + closingCosts + loanPointsCost + inputs.rehabCost;

  const pAndI = monthlyPrincipalAndInterest(
    loanAmount,
    inputs.interestRatePercent,
    inputs.loanTermYears
  );

  // PMI only applies to conventional loans with less than 20% down, and
  // automatically cancels once the balance falls to 80% of the ORIGINAL
  // purchase price (Homeowners Protection Act) — not 80% of current
  // value, and not something a borrower has to request. Year 1 always
  // starts at the full loan amount, so this is just the < 20%-down check;
  // later years are handled in the projection loop below.
  const pmiEligible = inputs.downPaymentPercent < 20 && inputs.pmiMonthlyPercent > 0;
  const monthlyPmi = pmiEligible ? (loanAmount * (inputs.pmiMonthlyPercent / 100)) / 12 : 0;

  const monthlyPropertyTax = inputs.propertyTaxAnnual / 12;
  const monthlyInsurance = inputs.insuranceAnnual / 12;
  const monthlyHoa = inputs.hoaMonthly;
  const monthlyMaintenance = inputs.monthlyRent * (inputs.maintenancePercent / 100);
  const monthlyCapEx = inputs.monthlyRent * (inputs.capExPercent / 100);
  const monthlyVacancyLoss = inputs.monthlyRent * (inputs.vacancyPercent / 100);
  const monthlyManagement = inputs.monthlyRent * (inputs.managementPercent / 100);
  const monthlyUtilities = inputs.utilitiesMonthlyOwnerPaid;

  const effectiveGrossMonthlyIncome =
    inputs.monthlyRent - monthlyVacancyLoss + inputs.otherMonthlyIncome;

  const totalMonthlyOperatingExpenses =
    monthlyPropertyTax +
    monthlyInsurance +
    monthlyHoa +
    monthlyMaintenance +
    monthlyCapEx +
    monthlyManagement +
    monthlyUtilities;

  const monthlyNoi = effectiveGrossMonthlyIncome - totalMonthlyOperatingExpenses;
  const annualNoi = monthlyNoi * 12;

  // PMI is deliberately excluded from totalMonthlyDebtService (and so
  // from DSCR below) — it's a financing-choice cost, not principal or
  // interest, and lenders' own DSCR calculations don't count it either.
  // It still reduces actual cash flow, so it comes out here instead.
  const totalMonthlyDebtService = pAndI;
  const monthlyCashFlow = monthlyNoi - totalMonthlyDebtService - monthlyPmi;
  const annualCashFlow = monthlyCashFlow * 12;
  const totalMonthlyOutflow = totalMonthlyOperatingExpenses + totalMonthlyDebtService + monthlyPmi;

  const capRatePercent =
    inputs.purchasePrice > 0 ? (annualNoi / inputs.purchasePrice) * 100 : 0;
  const cashOnCashReturnPercent =
    totalCashInvested > 0 ? (annualCashFlow / totalCashInvested) * 100 : 0;
  const annualDebtService = totalMonthlyDebtService * 12;
  const dscr = annualDebtService > 0 ? annualNoi / annualDebtService : Infinity;
  const grossRentMultiplier =
    inputs.monthlyRent > 0 ? inputs.purchasePrice / (inputs.monthlyRent * 12) : 0;
  const onePercentRulePercent =
    inputs.purchasePrice > 0 ? (inputs.monthlyRent / inputs.purchasePrice) * 100 : 0;

  // Classic 50% rule: operating expenses (excluding debt service) as a
  // share of gross scheduled rent (not effective/vacancy-adjusted).
  const fiftyPercentRuleExpensesPercent =
    inputs.monthlyRent > 0
      ? (totalMonthlyOperatingExpenses / inputs.monthlyRent) * 100
      : 0;

  const grossPotentialIncome = inputs.monthlyRent + inputs.otherMonthlyIncome;
  const breakEvenRatioPercent =
    grossPotentialIncome > 0
      ? ((totalMonthlyOperatingExpenses + totalMonthlyDebtService) /
          grossPotentialIncome) *
        100
      : 0;
  const debtYieldPercent =
    loanAmount > 0 ? (annualNoi / loanAmount) * 100 : Infinity;

  // --- Multi-year projection ---
  const years = Math.max(inputs.holdPeriodYears, 1);
  const amort = amortizationSchedule(
    loanAmount,
    inputs.interestRatePercent,
    inputs.loanTermYears,
    years
  );

  const projection: ProjectionYear[] = [];
  let cumulativeCashFlow = 0;
  let pmiDropsAfterYear: number | null = null;
  let pmiWasActiveLastYear = pmiEligible;
  for (let year = 1; year <= years; year++) {
    const growth = (rate: number) => Math.pow(1 + rate / 100, year - 1);

    // Charged against this year's *beginning* balance — the balance PMI
    // is actually assessed against for the year, and what year 1 already
    // used above via loanAmount (a year's beginning balance).
    const beginningBalance = amort[year - 1]?.beginningBalance ?? loanAmount;
    const pmiActiveThisYear = pmiEligible && beginningBalance / inputs.purchasePrice > 0.8;
    const pmiAnnual = pmiActiveThisYear ? loanAmount * (inputs.pmiMonthlyPercent / 100) : 0;
    if (pmiWasActiveLastYear && !pmiActiveThisYear) pmiDropsAfterYear = year - 1;
    pmiWasActiveLastYear = pmiActiveThisYear;

    const grossRentAnnual =
      inputs.monthlyRent * 12 * growth(inputs.annualRentGrowthPercent);
    const otherIncomeAnnual =
      inputs.otherMonthlyIncome * 12 * growth(inputs.annualRentGrowthPercent);
    const vacancyLossAnnual = grossRentAnnual * (inputs.vacancyPercent / 100);
    const effectiveGrossIncome =
      grossRentAnnual - vacancyLossAnnual + otherIncomeAnnual;

    const opExGrowthFactor = growth(inputs.annualExpenseGrowthPercent);
    const taxAnnual = inputs.propertyTaxAnnual * opExGrowthFactor;
    const insuranceAnnualY = inputs.insuranceAnnual * opExGrowthFactor;
    const hoaAnnual = inputs.hoaMonthly * 12 * opExGrowthFactor;
    const maintenanceAnnual = grossRentAnnual * (inputs.maintenancePercent / 100);
    const capExAnnual = grossRentAnnual * (inputs.capExPercent / 100);
    const managementAnnual = grossRentAnnual * (inputs.managementPercent / 100);
    const utilitiesAnnual = inputs.utilitiesMonthlyOwnerPaid * 12 * opExGrowthFactor;

    const operatingExpenses =
      taxAnnual +
      insuranceAnnualY +
      hoaAnnual +
      maintenanceAnnual +
      capExAnnual +
      managementAnnual +
      utilitiesAnnual;

    const noi = effectiveGrossIncome - operatingExpenses;
    const debtServiceYear = totalMonthlyDebtService * 12;
    const cashFlow = noi - debtServiceYear - pmiAnnual;
    cumulativeCashFlow += cashFlow;

    const propertyValue =
      inputs.purchasePrice * growth(inputs.annualAppreciationPercent);
    const loanBalance = amort[year - 1]?.endingBalance ?? 0;
    const equity = propertyValue - loanBalance;

    projection.push({
      year,
      grossRent: grossRentAnnual,
      effectiveGrossIncome,
      operatingExpenses,
      noi,
      debtService: debtServiceYear,
      cashFlow,
      cumulativeCashFlow,
      propertyValue,
      loanBalance,
      equity,
    });
  }

  const finalYear = projection[projection.length - 1];
  const exitValue = finalYear ? finalYear.propertyValue : inputs.purchasePrice;
  const sellingCosts = exitValue * (inputs.sellingCostPercent / 100);
  const remainingLoanBalance = finalYear ? finalYear.loanBalance : loanAmount;
  const netSaleProceedsAtExit = exitValue - sellingCosts - remainingLoanBalance;

  const irrCashFlows = [-totalCashInvested];
  projection.forEach((p, idx) => {
    const isLast = idx === projection.length - 1;
    irrCashFlows.push(p.cashFlow + (isLast ? netSaleProceedsAtExit : 0));
  });
  const irrPercent = calculateIrr(irrCashFlows);

  const totalReturnAtExit =
    cumulativeCashFlow + netSaleProceedsAtExit - totalCashInvested;
  const equityMultiple =
    totalCashInvested > 0
      ? (cumulativeCashFlow + netSaleProceedsAtExit) / totalCashInvested
      : 0;

  return {
    loanAmount,
    downPaymentAmount,
    closingCosts,
    loanPointsCost,
    totalCashInvested,

    monthlyPrincipalAndInterest: pAndI,
    monthlyPmi,
    pmiDropsAfterYear,
    monthlyPropertyTax,
    monthlyInsurance,
    monthlyHoa,
    monthlyMaintenance,
    monthlyCapEx,
    monthlyVacancyLoss,
    monthlyManagement,
    monthlyUtilities,
    totalMonthlyOperatingExpenses,
    totalMonthlyDebtService,
    totalMonthlyOutflow,

    monthlyGrossRent: inputs.monthlyRent,
    effectiveGrossMonthlyIncome,
    monthlyNoi,
    annualNoi,
    monthlyCashFlow,
    annualCashFlow,

    capRatePercent,
    cashOnCashReturnPercent,
    dscr,
    grossRentMultiplier,
    onePercentRulePercent,
    fiftyPercentRuleExpensesPercent,
    breakEvenRatioPercent,
    debtYieldPercent,

    projection,
    irrPercent,
    netSaleProceedsAtExit,
    totalReturnAtExit,
    equityMultiple,
  };
}

export const DEFAULT_INPUTS: PropertyInputs = {
  address: "",
  purchasePrice: 350000,
  downPaymentPercent: 20,
  interestRatePercent: 6.75,
  loanTermYears: 30,
  closingCostPercent: 3,
  loanPointsPercent: 0,
  pmiMonthlyPercent: 0,
  rehabCost: 0,

  monthlyRent: 2600,
  otherMonthlyIncome: 0,

  propertyTaxAnnual: 4200,
  insuranceAnnual: 1800,
  hoaMonthly: 0,
  utilitiesMonthlyOwnerPaid: 0,

  maintenancePercent: 5,
  capExPercent: 5,
  vacancyPercent: 5,
  managementPercent: 8,

  annualRentGrowthPercent: 3,
  annualExpenseGrowthPercent: 2.5,
  annualAppreciationPercent: 3.5,
  sellingCostPercent: 7,
  holdPeriodYears: 10,
};
