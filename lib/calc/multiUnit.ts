import {
  amortizationSchedule,
  calculateIrr,
  monthlyPrincipalAndInterest,
} from "@/lib/calculations";
import { computeVerdict, type WeightedCriterion } from "@/lib/verdict/scoreCriteria";
import type { Verdict, VerdictLabel } from "@/lib/types";

export interface UnitType {
  label: string;
  count: number;
  avgMonthlyRent: number;
}

export interface MultiUnitProjectionYear {
  year: number;
  grossPotentialRent: number;
  effectiveGrossIncome: number;
  operatingExpenses: number;
  noi: number;
  debtService: number;
  cashFlow: number;
  cumulativeCashFlow: number;
  propertyValue: number;
  loanBalance: number;
  equity: number;
}

export interface MultiUnitInputs {
  address: string;
  purchasePrice: number;
  unitMix: UnitType[];
  otherMonthlyIncome: number;

  downPaymentPercent: number;
  interestRatePercent: number;
  amortizationYears: number;
  loanTermYears: number;
  closingCostPercent: number;
  loanPointsPercent: number;
  rehabCost: number;

  propertyTaxAnnual: number;
  insuranceAnnual: number;
  payrollAnnual: number;
  commonAreaUtilitiesMonthly: number;
  otherOpExMonthly: number;
  managementPercent: number;
  economicVacancyPercent: number;
  capExReservePerUnitAnnual: number;

  marketCapRatePercent: number;
  exitCapRatePercent: number;
  annualRentGrowthPercent: number;
  annualExpenseGrowthPercent: number;
  sellingCostPercent: number;
  holdPeriodYears: number;
}

export interface MultiUnitResult {
  totalUnits: number;
  grossPotentialRentAnnual: number;
  economicVacancyLossAnnual: number;
  effectiveGrossIncomeAnnual: number;
  operatingExpensesAnnual: number;
  expenseRatioPercent: number;
  noiAnnual: number;
  capRatePercent: number;
  impliedValue: number;
  overUnderPricedPercent: number;

  loanAmount: number;
  downPaymentAmount: number;
  closingCosts: number;
  loanPointsCost: number;
  totalCashInvested: number;
  monthlyDebtService: number;
  annualDebtService: number;
  dscr: number;

  monthlyCashFlow: number;
  annualCashFlow: number;
  cashOnCashReturnPercent: number;
  pricePerUnit: number;

  balloonRisk: boolean;

  projection: MultiUnitProjectionYear[];
  irrPercent: number | null;
  netSaleProceedsAtExit: number;
  totalReturnAtExit: number;
  equityMultiple: number;
}

export function analyzeMultiUnit(inputs: MultiUnitInputs): MultiUnitResult {
  const totalUnits = inputs.unitMix.reduce((sum, u) => sum + u.count, 0);
  const grossPotentialRentAnnual =
    inputs.unitMix.reduce((sum, u) => sum + u.count * u.avgMonthlyRent, 0) * 12;
  const economicVacancyLossAnnual =
    grossPotentialRentAnnual * (inputs.economicVacancyPercent / 100);
  const otherIncomeAnnual = inputs.otherMonthlyIncome * 12;
  const effectiveGrossIncomeAnnual =
    grossPotentialRentAnnual - economicVacancyLossAnnual + otherIncomeAnnual;

  const operatingExpensesAnnual =
    inputs.propertyTaxAnnual +
    inputs.insuranceAnnual +
    inputs.payrollAnnual +
    inputs.commonAreaUtilitiesMonthly * 12 +
    inputs.otherOpExMonthly * 12 +
    effectiveGrossIncomeAnnual * (inputs.managementPercent / 100) +
    inputs.capExReservePerUnitAnnual * totalUnits;

  const expenseRatioPercent =
    effectiveGrossIncomeAnnual > 0
      ? (operatingExpensesAnnual / effectiveGrossIncomeAnnual) * 100
      : 0;

  const noiAnnual = effectiveGrossIncomeAnnual - operatingExpensesAnnual;
  const capRatePercent =
    inputs.purchasePrice > 0 ? (noiAnnual / inputs.purchasePrice) * 100 : 0;
  const impliedValue =
    inputs.marketCapRatePercent > 0 ? noiAnnual / (inputs.marketCapRatePercent / 100) : 0;
  const overUnderPricedPercent =
    impliedValue > 0 ? ((inputs.purchasePrice - impliedValue) / impliedValue) * 100 : 0;

  const downPaymentAmount = inputs.purchasePrice * (inputs.downPaymentPercent / 100);
  const loanAmount = inputs.purchasePrice - downPaymentAmount;
  const closingCosts = inputs.purchasePrice * (inputs.closingCostPercent / 100);
  const loanPointsCost = loanAmount * (inputs.loanPointsPercent / 100);
  const totalCashInvested = downPaymentAmount + closingCosts + loanPointsCost + inputs.rehabCost;

  const monthlyDebtService = monthlyPrincipalAndInterest(
    loanAmount,
    inputs.interestRatePercent,
    inputs.amortizationYears
  );
  const annualDebtService = monthlyDebtService * 12;
  const dscr = annualDebtService > 0 ? noiAnnual / annualDebtService : Infinity;

  const monthlyCashFlow = noiAnnual / 12 - monthlyDebtService;
  const annualCashFlow = monthlyCashFlow * 12;
  const cashOnCashReturnPercent =
    totalCashInvested > 0 ? (annualCashFlow / totalCashInvested) * 100 : 0;
  const pricePerUnit = totalUnits > 0 ? inputs.purchasePrice / totalUnits : 0;
  const balloonRisk = inputs.loanTermYears < inputs.holdPeriodYears;

  // --- Multi-year projection, valued via the income approach (NOI /
  // exit cap rate) each year rather than a flat appreciation rate — the
  // standard way 5+ unit properties are valued. ---
  const years = Math.max(inputs.holdPeriodYears, 1);
  const amort = amortizationSchedule(
    loanAmount,
    inputs.interestRatePercent,
    inputs.amortizationYears,
    years
  );

  const projection: MultiUnitProjectionYear[] = [];
  let cumulativeCashFlow = 0;
  for (let year = 1; year <= years; year++) {
    const rentGrowth = Math.pow(1 + inputs.annualRentGrowthPercent / 100, year - 1);
    const expenseGrowth = Math.pow(1 + inputs.annualExpenseGrowthPercent / 100, year - 1);

    const gpr = grossPotentialRentAnnual * rentGrowth;
    const otherIncome = otherIncomeAnnual * rentGrowth;
    const vacancyLoss = gpr * (inputs.economicVacancyPercent / 100);
    const egi = gpr - vacancyLoss + otherIncome;

    const opEx =
      (inputs.propertyTaxAnnual +
        inputs.insuranceAnnual +
        inputs.payrollAnnual +
        inputs.commonAreaUtilitiesMonthly * 12 +
        inputs.otherOpExMonthly * 12) *
        expenseGrowth +
      egi * (inputs.managementPercent / 100) +
      inputs.capExReservePerUnitAnnual * totalUnits * expenseGrowth;

    const noi = egi - opEx;
    const debtService = annualDebtService;
    const cashFlow = noi - debtService;
    cumulativeCashFlow += cashFlow;

    const propertyValue =
      inputs.exitCapRatePercent > 0 ? noi / (inputs.exitCapRatePercent / 100) : inputs.purchasePrice;
    const loanBalance = amort[year - 1]?.endingBalance ?? 0;
    const equity = propertyValue - loanBalance;

    projection.push({
      year,
      grossPotentialRent: gpr,
      effectiveGrossIncome: egi,
      operatingExpenses: opEx,
      noi,
      debtService,
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

  const totalReturnAtExit = cumulativeCashFlow + netSaleProceedsAtExit - totalCashInvested;
  const equityMultiple =
    totalCashInvested > 0 ? (cumulativeCashFlow + netSaleProceedsAtExit) / totalCashInvested : 0;

  return {
    totalUnits,
    grossPotentialRentAnnual,
    economicVacancyLossAnnual,
    effectiveGrossIncomeAnnual,
    operatingExpensesAnnual,
    expenseRatioPercent,
    noiAnnual,
    capRatePercent,
    impliedValue,
    overUnderPricedPercent,
    loanAmount,
    downPaymentAmount,
    closingCosts,
    loanPointsCost,
    totalCashInvested,
    monthlyDebtService,
    annualDebtService,
    dscr,
    monthlyCashFlow,
    annualCashFlow,
    cashOnCashReturnPercent,
    pricePerUnit,
    balloonRisk,
    projection,
    irrPercent,
    netSaleProceedsAtExit,
    totalReturnAtExit,
    equityMultiple,
  };
}

const SUMMARIES: Record<VerdictLabel, string> = {
  "Strong Buy":
    "Strong on income-approach fundamentals: DSCR, cap rate spread to market, and cash-on-cash all clear the bar. Verify the rent roll and trailing 12-month operating statement (T12) against the seller's numbers before moving forward.",
  "Good Investment":
    "Solid deal overall. Push on price or terms where it's weakest, and get a real T12 and rent roll from the seller — pro forma numbers on 5+ unit deals are often optimistic.",
  "Marginal — Negotiate":
    "Thin cushion on lender-critical metrics like DSCR. Commercial lenders will scrutinize this closely — negotiate price or increase the down payment before underwriting starts.",
  Pass: "Doesn't clear standard multifamily underwriting benchmarks at these numbers. A DSCR or cap-rate shortfall here usually means the deal won't get financed on these terms, not just that returns are mediocre.",
};

export function evaluateMultiUnitVerdict(
  result: MultiUnitResult,
  inputs: MultiUnitInputs
): Verdict {
  const criteria: WeightedCriterion[] = [
    {
      label: "DSCR ≥ 1.25 (commercial lender minimum)",
      pass: result.dscr >= 1.25,
      detail: `DSCR is ${Number.isFinite(result.dscr) ? result.dscr.toFixed(2) : "∞ (no debt)"}. Most commercial multifamily lenders require ≥1.25.`,
      weight: 30,
    },
    {
      label: "Priced at or below your market cap rate assumption",
      pass: result.overUnderPricedPercent <= 0,
      detail:
        result.impliedValue > 0
          ? `At your ${inputs.marketCapRatePercent.toFixed(2)}% market cap rate assumption, this NOI implies a value of $${Math.round(result.impliedValue).toLocaleString()} vs. a purchase price of $${Math.round(inputs.purchasePrice).toLocaleString()} (${result.overUnderPricedPercent >= 0 ? "+" : ""}${result.overUnderPricedPercent.toFixed(1)}% vs. implied value).`
          : "Set a market cap rate assumption to compare purchase price against the income-approach value.",
      weight: 20,
    },
    {
      label: "Positive monthly cash flow",
      pass: result.monthlyCashFlow > 0,
      detail: `Monthly cash flow is $${result.monthlyCashFlow.toFixed(0)}.`,
      weight: 20,
    },
    {
      label: "Cash-on-cash return ≥ 8%",
      pass: result.cashOnCashReturnPercent >= 8,
      detail: `Cash-on-cash return is ${result.cashOnCashReturnPercent.toFixed(1)}%.`,
      weight: 15,
    },
    {
      label: "Expense ratio ≤ 55%",
      pass: result.expenseRatioPercent <= 55,
      detail: `Operating expenses are ${result.expenseRatioPercent.toFixed(0)}% of effective gross income (typical apartment range is 40-50%).`,
      weight: 10,
    },
    {
      label: "No balloon payment due before your planned hold ends",
      pass: !result.balloonRisk,
      detail: result.balloonRisk
        ? "Your loan term is shorter than your hold period — you'll need to refinance or sell before the loan matures."
        : "Loan term covers your full planned hold period.",
      weight: 5,
    },
  ];

  let bonus = 0;
  if (result.dscr >= 1.5) bonus += 5;
  if (result.cashOnCashReturnPercent >= 15) bonus += 5;

  return computeVerdict(criteria, bonus, SUMMARIES, {
    triggered: !Number.isFinite(result.dscr) ? false : result.dscr < 1.0,
    summary:
      "NOI doesn't even cover the debt service (DSCR below 1.0) — this deal is cash-flow negative before you factor in any reserves. It will not qualify for standard commercial financing at these terms.",
  });
}

export const DEFAULT_MULTI_UNIT_INPUTS: MultiUnitInputs = {
  address: "",
  purchasePrice: 2200000,
  unitMix: [
    { label: "1BR / 1BA", count: 8, avgMonthlyRent: 1350 },
    { label: "2BR / 1BA", count: 8, avgMonthlyRent: 1650 },
  ],
  otherMonthlyIncome: 400,

  downPaymentPercent: 25,
  interestRatePercent: 7,
  amortizationYears: 25,
  loanTermYears: 10,
  closingCostPercent: 2.5,
  loanPointsPercent: 0,
  rehabCost: 0,

  propertyTaxAnnual: 26000,
  insuranceAnnual: 14000,
  payrollAnnual: 0,
  commonAreaUtilitiesMonthly: 900,
  otherOpExMonthly: 600,
  managementPercent: 6,
  economicVacancyPercent: 7,
  capExReservePerUnitAnnual: 300,

  marketCapRatePercent: 6,
  exitCapRatePercent: 6.25,
  annualRentGrowthPercent: 3,
  annualExpenseGrowthPercent: 3,
  sellingCostPercent: 2,
  holdPeriodYears: 10,
};
