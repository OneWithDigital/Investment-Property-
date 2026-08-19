import {
  amortizationSchedule,
  calculateIrr,
  monthlyPrincipalAndInterest,
} from "@/lib/calculations";
import { computeVerdict, type WeightedCriterion } from "@/lib/verdict/scoreCriteria";
import type { Verdict, VerdictLabel } from "@/lib/types";

export type LeaseStructure = "NNN" | "modified-gross" | "full-service-gross";

export const LEASE_STRUCTURE_LABELS: Record<LeaseStructure, string> = {
  NNN: "Triple Net (NNN) — tenants pay taxes, insurance & CAM",
  "modified-gross": "Modified Gross — costs split by agreement",
  "full-service-gross": "Full Service Gross — landlord pays all operating costs",
};

export const DEFAULT_REIMBURSEMENT_PERCENT: Record<LeaseStructure, number> = {
  NNN: 95,
  "modified-gross": 50,
  "full-service-gross": 0,
};

export interface CommercialTenant {
  name: string;
  sqftLeased: number;
  annualRentPerSqft: number;
  leaseYearsRemaining: number;
}

export interface CommercialProjectionYear {
  year: number;
  leasedRent: number;
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

export interface CommercialInputs {
  address: string;
  buildingSqft: number;
  purchasePrice: number;
  leaseStructure: LeaseStructure;
  tenants: CommercialTenant[];
  vacantSqft: number;
  marketRentPerSqftAnnual: number;
  otherMonthlyIncome: number;
  reimbursementPercent: number;

  downPaymentPercent: number;
  interestRatePercent: number;
  amortizationYears: number;
  loanTermYears: number;
  closingCostPercent: number;
  loanPointsPercent: number;
  rehabCost: number;

  propertyTaxAnnual: number;
  insuranceAnnual: number;
  camAnnual: number;
  managementPercent: number;
  creditLossPercent: number;

  exitCapRatePercent: number;
  annualRentGrowthPercent: number;
  annualExpenseGrowthPercent: number;
  sellingCostPercent: number;
  holdPeriodYears: number;
}

export interface CommercialResult {
  leasedSqft: number;
  occupancyPercent: number;
  leasedRentAnnual: number;
  vacantPotentialRentAnnual: number;
  avgInPlaceRentPerSqft: number;
  waltYears: number;
  pricePerSqft: number;

  reimbursementIncomeAnnual: number;
  creditLossAnnual: number;
  effectiveGrossIncomeAnnual: number;
  landlordOperatingExpensesAnnual: number;
  noiAnnual: number;
  capRatePercent: number;

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
  balloonRisk: boolean;

  projection: CommercialProjectionYear[];
  irrPercent: number | null;
  netSaleProceedsAtExit: number;
  totalReturnAtExit: number;
  equityMultiple: number;
}

export function analyzeCommercial(inputs: CommercialInputs): CommercialResult {
  const leasedSqft = inputs.tenants.reduce((sum, t) => sum + t.sqftLeased, 0);
  const occupancyPercent =
    inputs.buildingSqft > 0 ? (leasedSqft / inputs.buildingSqft) * 100 : 0;
  const leasedRentAnnual = inputs.tenants.reduce(
    (sum, t) => sum + t.sqftLeased * t.annualRentPerSqft,
    0
  );
  const vacantPotentialRentAnnual = inputs.vacantSqft * inputs.marketRentPerSqftAnnual;
  const avgInPlaceRentPerSqft = leasedSqft > 0 ? leasedRentAnnual / leasedSqft : 0;
  const waltYears =
    leasedSqft > 0
      ? inputs.tenants.reduce((sum, t) => sum + t.sqftLeased * t.leaseYearsRemaining, 0) /
        leasedSqft
      : 0;
  const pricePerSqft = inputs.buildingSqft > 0 ? inputs.purchasePrice / inputs.buildingSqft : 0;

  const creditLossAnnual = leasedRentAnnual * (inputs.creditLossPercent / 100);
  const reimbursableCosts = inputs.propertyTaxAnnual + inputs.insuranceAnnual + inputs.camAnnual;
  const reimbursementIncomeAnnual = reimbursableCosts * (inputs.reimbursementPercent / 100);
  const otherIncomeAnnual = inputs.otherMonthlyIncome * 12;

  const effectiveGrossIncomeAnnual =
    leasedRentAnnual - creditLossAnnual + reimbursementIncomeAnnual + otherIncomeAnnual;

  const landlordOperatingExpensesAnnual =
    reimbursableCosts * (1 - inputs.reimbursementPercent / 100) +
    effectiveGrossIncomeAnnual * (inputs.managementPercent / 100);

  const noiAnnual = effectiveGrossIncomeAnnual - landlordOperatingExpensesAnnual;
  const capRatePercent =
    inputs.purchasePrice > 0 ? (noiAnnual / inputs.purchasePrice) * 100 : 0;

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
  const balloonRisk = inputs.loanTermYears < inputs.holdPeriodYears;

  const years = Math.max(inputs.holdPeriodYears, 1);
  const amort = amortizationSchedule(
    loanAmount,
    inputs.interestRatePercent,
    inputs.amortizationYears,
    years
  );

  const projection: CommercialProjectionYear[] = [];
  let cumulativeCashFlow = 0;
  for (let year = 1; year <= years; year++) {
    const rentGrowth = Math.pow(1 + inputs.annualRentGrowthPercent / 100, year - 1);
    const expenseGrowth = Math.pow(1 + inputs.annualExpenseGrowthPercent / 100, year - 1);

    const leasedRent = leasedRentAnnual * rentGrowth;
    const creditLoss = leasedRent * (inputs.creditLossPercent / 100);
    const reimbursableCostsYear = reimbursableCosts * expenseGrowth;
    const reimbursementIncome = reimbursableCostsYear * (inputs.reimbursementPercent / 100);
    const otherIncome = otherIncomeAnnual * rentGrowth;
    const egi = leasedRent - creditLoss + reimbursementIncome + otherIncome;
    const opEx =
      reimbursableCostsYear * (1 - inputs.reimbursementPercent / 100) +
      egi * (inputs.managementPercent / 100);
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
      leasedRent,
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
    leasedSqft,
    occupancyPercent,
    leasedRentAnnual,
    vacantPotentialRentAnnual,
    avgInPlaceRentPerSqft,
    waltYears,
    pricePerSqft,
    reimbursementIncomeAnnual,
    creditLossAnnual,
    effectiveGrossIncomeAnnual,
    landlordOperatingExpensesAnnual,
    noiAnnual,
    capRatePercent,
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
    "Clears standard commercial underwriting benchmarks: debt coverage, lease stability (WALT), and cap rate spread. Verify tenant credit quality and get estoppel certificates before closing.",
  "Good Investment":
    "Solid deal with room to improve — likely on lease rollover risk or pricing relative to your cap rate assumption. Worth pursuing with eyes open on the weak point.",
  "Marginal — Negotiate":
    "Thin margins for a commercial deal, where vacancy and lease rollover swings are larger than residential. Negotiate price or require longer lease terms from tenants as a condition of closing.",
  Pass: "Doesn't clear standard commercial benchmarks. Weak DSCR or heavy near-term lease rollover risk means real exposure to vacancy loss and refinancing risk.",
};

export function evaluateCommercialVerdict(
  result: CommercialResult,
  inputs: CommercialInputs
): Verdict {
  const criteria: WeightedCriterion[] = [
    {
      label: "DSCR ≥ 1.25 (commercial lender minimum)",
      pass: result.dscr >= 1.25,
      detail: `DSCR is ${Number.isFinite(result.dscr) ? result.dscr.toFixed(2) : "∞ (no debt)"}.`,
      weight: 30,
    },
    {
      label: "Going-in cap rate ≥ assumed exit cap rate",
      pass: result.capRatePercent >= inputs.exitCapRatePercent,
      detail: `Going-in cap rate is ${result.capRatePercent.toFixed(2)}% vs. a ${inputs.exitCapRatePercent.toFixed(2)}% exit cap rate assumption. Buying at or above your exit cap rate gives you a margin of safety instead of relying on cap rate compression.`,
      weight: 20,
    },
    {
      label: "Weighted average lease term (WALT) ≥ 3 years",
      pass: result.waltYears >= 3,
      detail: `WALT is ${result.waltYears.toFixed(1)} years. Shorter WALT means more near-term re-leasing risk and vacancy exposure.`,
      weight: 15,
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
      weight: 10,
    },
    {
      label: "Occupancy ≥ 90%",
      pass: result.occupancyPercent >= 90,
      detail: `${result.occupancyPercent.toFixed(0)}% of building square footage is leased. ${result.vacantPotentialRentAnnual > 0 ? `Leasing the vacant space at market rent would add ~$${Math.round(result.vacantPotentialRentAnnual).toLocaleString()}/yr.` : ""}`,
      weight: 5,
    },
  ];

  let bonus = 0;
  if (result.dscr >= 1.5) bonus += 5;
  if (result.waltYears >= 7) bonus += 5;

  return computeVerdict(criteria, bonus, SUMMARIES, {
    triggered: !Number.isFinite(result.dscr) ? false : result.dscr < 1.0,
    summary:
      "NOI doesn't cover debt service (DSCR below 1.0). This won't qualify for standard commercial financing at these terms regardless of the lease quality.",
  });
}

export const DEFAULT_COMMERCIAL_INPUTS: CommercialInputs = {
  address: "",
  buildingSqft: 12000,
  purchasePrice: 1800000,
  leaseStructure: "NNN",
  tenants: [
    { name: "Tenant A", sqftLeased: 6000, annualRentPerSqft: 18, leaseYearsRemaining: 5 },
    { name: "Tenant B", sqftLeased: 4000, annualRentPerSqft: 16, leaseYearsRemaining: 2 },
  ],
  vacantSqft: 2000,
  marketRentPerSqftAnnual: 17,
  otherMonthlyIncome: 0,
  reimbursementPercent: 95,

  downPaymentPercent: 30,
  interestRatePercent: 7.25,
  amortizationYears: 25,
  loanTermYears: 10,
  closingCostPercent: 2.5,
  loanPointsPercent: 0,
  rehabCost: 0,

  propertyTaxAnnual: 24000,
  insuranceAnnual: 9000,
  camAnnual: 15000,
  managementPercent: 4,
  creditLossPercent: 3,

  exitCapRatePercent: 7,
  annualRentGrowthPercent: 2.5,
  annualExpenseGrowthPercent: 3,
  sellingCostPercent: 2,
  holdPeriodYears: 10,
};
