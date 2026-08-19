import {
  amortizationSchedule,
  calculateIrr,
  monthlyPrincipalAndInterest,
} from "@/lib/calculations";
import { computeVerdict, type WeightedCriterion } from "@/lib/verdict/scoreCriteria";
import type { ProjectionYear, Verdict, VerdictLabel } from "@/lib/types";

export type StrRegulationRisk =
  | "unrestricted"
  | "permit-required"
  | "restricted-capped"
  | "banned";

export const STR_REGULATION_LABELS: Record<StrRegulationRisk, string> = {
  unrestricted: "Unrestricted",
  "permit-required": "Permit/license required",
  "restricted-capped": "Restricted or capped (limited permits, minimum-stay rules, etc.)",
  banned: "Banned in this jurisdiction",
};

export interface ShortTermRentalInputs {
  address: string;
  purchasePrice: number;
  downPaymentPercent: number;
  interestRatePercent: number;
  loanTermYears: number;
  closingCostPercent: number;
  loanPointsPercent: number;
  furnishingSetupCost: number;

  averageDailyRate: number;
  occupancyPercent: number;
  avgNightsPerStay: number;
  cleaningFeePerStay: number;
  cleaningCostPerStay: number;
  otherMonthlyIncome: number;

  platformFeePercent: number;
  managementPercent: number;
  suppliesMonthly: number;
  utilitiesMonthlyOwnerPaid: number;
  internetCableMonthly: number;
  otherMonthlyOperatingCosts: number;

  propertyTaxAnnual: number;
  insuranceAnnual: number;
  hoaMonthly: number;
  strPermitAnnualFee: number;

  maintenancePercent: number;
  capExPercent: number;

  strRegulationRisk: StrRegulationRisk;
  comparableLongTermMonthlyRent: number;

  annualRevenueGrowthPercent: number;
  annualExpenseGrowthPercent: number;
  annualAppreciationPercent: number;
  sellingCostPercent: number;
  holdPeriodYears: number;
}

export interface ShortTermRentalResult {
  grossBookingRevenueAnnual: number;
  numberOfStaysPerYear: number;
  cleaningRevenueAnnual: number;
  cleaningCostAnnual: number;
  grossIncomeAnnual: number;
  platformFeesAnnual: number;
  managementFeeAnnual: number;
  totalOperatingExpensesAnnual: number;
  noiAnnual: number;
  monthlyNoi: number;

  loanAmount: number;
  downPaymentAmount: number;
  closingCosts: number;
  loanPointsCost: number;
  totalCashInvested: number;
  monthlyPrincipalAndInterest: number;
  monthlyCashFlow: number;
  annualCashFlow: number;

  capRatePercent: number;
  cashOnCashReturnPercent: number;
  dscr: number;
  revenuePerAvailableNight: number;
  breakEvenOccupancyPercent: number;

  strPremiumMonthly: number | null;

  projection: ProjectionYear[];
  irrPercent: number | null;
  netSaleProceedsAtExit: number;
  totalReturnAtExit: number;
  equityMultiple: number;
}

function fixedAnnualOperatingCosts(inputs: ShortTermRentalInputs): number {
  return (
    inputs.propertyTaxAnnual +
    inputs.insuranceAnnual +
    inputs.hoaMonthly * 12 +
    inputs.strPermitAnnualFee +
    inputs.suppliesMonthly * 12 +
    inputs.utilitiesMonthlyOwnerPaid * 12 +
    inputs.internetCableMonthly * 12 +
    inputs.otherMonthlyOperatingCosts * 12
  );
}

/** Annual cash flow as a function of occupancy fraction (0-1); linear in occupancy. */
function cashFlowAtOccupancy(
  inputs: ShortTermRentalInputs,
  occFraction: number,
  fixedOpEx: number,
  annualDebtService: number
): number {
  const nightsPerStay = Math.max(inputs.avgNightsPerStay, 1);
  const bookingRevenue = inputs.averageDailyRate * 365 * occFraction;
  const stays = (365 * occFraction) / nightsPerStay;
  const cleaningRevenue = inputs.cleaningFeePerStay * stays;
  const cleaningCost = inputs.cleaningCostPerStay * stays;
  const otherIncome = inputs.otherMonthlyIncome * 12;
  const grossIncome = bookingRevenue + cleaningRevenue + otherIncome;

  const platformFees = bookingRevenue * (inputs.platformFeePercent / 100);
  const managementFee = grossIncome * (inputs.managementPercent / 100);
  const maintenance = bookingRevenue * (inputs.maintenancePercent / 100);
  const capEx = bookingRevenue * (inputs.capExPercent / 100);

  const variableExpenses = platformFees + managementFee + maintenance + capEx + cleaningCost;
  const noi = grossIncome - fixedOpEx - variableExpenses;
  return noi - annualDebtService;
}

export function analyzeShortTermRental(
  inputs: ShortTermRentalInputs
): ShortTermRentalResult {
  const nightsPerStay = Math.max(inputs.avgNightsPerStay, 1);
  const occFraction = inputs.occupancyPercent / 100;

  const grossBookingRevenueAnnual = inputs.averageDailyRate * 365 * occFraction;
  const numberOfStaysPerYear = (365 * occFraction) / nightsPerStay;
  const cleaningRevenueAnnual = inputs.cleaningFeePerStay * numberOfStaysPerYear;
  const cleaningCostAnnual = inputs.cleaningCostPerStay * numberOfStaysPerYear;
  const otherIncomeAnnual = inputs.otherMonthlyIncome * 12;
  const grossIncomeAnnual = grossBookingRevenueAnnual + cleaningRevenueAnnual + otherIncomeAnnual;

  const platformFeesAnnual = grossBookingRevenueAnnual * (inputs.platformFeePercent / 100);
  const managementFeeAnnual = grossIncomeAnnual * (inputs.managementPercent / 100);
  const maintenanceAnnual = grossBookingRevenueAnnual * (inputs.maintenancePercent / 100);
  const capExAnnual = grossBookingRevenueAnnual * (inputs.capExPercent / 100);
  const fixedOpEx = fixedAnnualOperatingCosts(inputs);

  const totalOperatingExpensesAnnual =
    fixedOpEx +
    platformFeesAnnual +
    managementFeeAnnual +
    maintenanceAnnual +
    capExAnnual +
    cleaningCostAnnual;

  const noiAnnual = grossIncomeAnnual - totalOperatingExpensesAnnual;
  const monthlyNoi = noiAnnual / 12;

  const downPaymentAmount = inputs.purchasePrice * (inputs.downPaymentPercent / 100);
  const loanAmount = inputs.purchasePrice - downPaymentAmount;
  const closingCosts = inputs.purchasePrice * (inputs.closingCostPercent / 100);
  const loanPointsCost = loanAmount * (inputs.loanPointsPercent / 100);
  const totalCashInvested = downPaymentAmount + closingCosts + loanPointsCost + inputs.furnishingSetupCost;

  const pAndI = monthlyPrincipalAndInterest(
    loanAmount,
    inputs.interestRatePercent,
    inputs.loanTermYears
  );
  const annualDebtService = pAndI * 12;
  const monthlyCashFlow = monthlyNoi - pAndI;
  const annualCashFlow = monthlyCashFlow * 12;

  const capRatePercent =
    inputs.purchasePrice > 0 ? (noiAnnual / inputs.purchasePrice) * 100 : 0;
  const cashOnCashReturnPercent =
    totalCashInvested > 0 ? (annualCashFlow / totalCashInvested) * 100 : 0;
  const dscr = annualDebtService > 0 ? noiAnnual / annualDebtService : Infinity;
  const revenuePerAvailableNight = grossBookingRevenueAnnual / 365;

  // Break-even occupancy: cash flow is linear in occupancy fraction, so
  // interpolate between occ=0 and occ=1.
  const cfAt0 = cashFlowAtOccupancy(inputs, 0, fixedOpEx, annualDebtService);
  const cfAt1 = cashFlowAtOccupancy(inputs, 1, fixedOpEx, annualDebtService);
  const breakEvenOccupancyPercent =
    cfAt1 === cfAt0 ? NaN : (-cfAt0 / (cfAt1 - cfAt0)) * 100;

  const strPremiumMonthly =
    inputs.comparableLongTermMonthlyRent > 0
      ? monthlyCashFlow -
        (inputs.comparableLongTermMonthlyRent -
          pAndI -
          inputs.propertyTaxAnnual / 12 -
          inputs.insuranceAnnual / 12 -
          inputs.hoaMonthly -
          inputs.comparableLongTermMonthlyRent * 0.15)
      : null;

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
  for (let year = 1; year <= years; year++) {
    const revenueGrowth = Math.pow(1 + inputs.annualRevenueGrowthPercent / 100, year - 1);
    const expenseGrowth = Math.pow(1 + inputs.annualExpenseGrowthPercent / 100, year - 1);

    const bookingRevenue = grossBookingRevenueAnnual * revenueGrowth;
    const stays = numberOfStaysPerYear;
    const cleaningRevenue = inputs.cleaningFeePerStay * stays * revenueGrowth;
    const otherIncome = otherIncomeAnnual * revenueGrowth;
    const grossIncome = bookingRevenue + cleaningRevenue + otherIncome;

    const platformFees = bookingRevenue * (inputs.platformFeePercent / 100);
    const managementFee = grossIncome * (inputs.managementPercent / 100);
    const maintenance = bookingRevenue * (inputs.maintenancePercent / 100);
    const capEx = bookingRevenue * (inputs.capExPercent / 100);
    const cleaningCost = inputs.cleaningCostPerStay * stays * expenseGrowth;
    const fixedOpExYear = fixedOpEx * expenseGrowth;

    const operatingExpenses =
      fixedOpExYear + platformFees + managementFee + maintenance + capEx + cleaningCost;
    const noi = grossIncome - operatingExpenses;
    const debtService = annualDebtService;
    const cashFlow = noi - debtService;
    cumulativeCashFlow += cashFlow;

    const propertyValue =
      inputs.purchasePrice * Math.pow(1 + inputs.annualAppreciationPercent / 100, year - 1);
    const loanBalance = amort[year - 1]?.endingBalance ?? 0;
    const equity = propertyValue - loanBalance;

    projection.push({
      year,
      grossRent: bookingRevenue,
      effectiveGrossIncome: grossIncome,
      operatingExpenses,
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
    grossBookingRevenueAnnual,
    numberOfStaysPerYear,
    cleaningRevenueAnnual,
    cleaningCostAnnual,
    grossIncomeAnnual,
    platformFeesAnnual,
    managementFeeAnnual,
    totalOperatingExpensesAnnual,
    noiAnnual,
    monthlyNoi,
    loanAmount,
    downPaymentAmount,
    closingCosts,
    loanPointsCost,
    totalCashInvested,
    monthlyPrincipalAndInterest: pAndI,
    monthlyCashFlow,
    annualCashFlow,
    capRatePercent,
    cashOnCashReturnPercent,
    dscr,
    revenuePerAvailableNight,
    breakEvenOccupancyPercent,
    strPremiumMonthly,
    projection,
    irrPercent,
    netSaleProceedsAtExit,
    totalReturnAtExit,
    equityMultiple,
  };
}

const SUMMARIES: Record<VerdictLabel, string> = {
  "Strong Buy":
    "Clears the higher bar STR deals should hit given the operational effort and regulatory exposure. Verify your ADR/occupancy assumptions against real comps on AirDNA or similar before committing.",
  "Good Investment":
    "Solid numbers with some thin spots — likely occupancy cushion or regulation risk. Worth pursuing if you're comfortable with the operational side of STR management.",
  "Marginal — Negotiate":
    "Thin margins for the added complexity of STR operations. Small misses on occupancy or ADR assumptions could flip this to a loss — stress-test before committing.",
  Pass: "Doesn't clear STR-specific benchmarks, which are intentionally higher than long-term rental given the extra effort, turnover costs, and regulatory risk involved.",
};

export function evaluateShortTermRentalVerdict(
  result: ShortTermRentalResult,
  inputs: ShortTermRentalInputs
): Verdict {
  if (inputs.strRegulationRisk === "banned") {
    return computeVerdict([], 0, SUMMARIES, {
      triggered: true,
      summary:
        "Short-term rentals are banned in this jurisdiction as entered. This isn't a numbers problem — confirm the actual local ordinance before doing anything else with this deal.",
    });
  }

  const occupancyCushion = result.breakEvenOccupancyPercent <= inputs.occupancyPercent - 15;

  const criteria: WeightedCriterion[] = [
    {
      label: "Positive monthly cash flow",
      pass: result.monthlyCashFlow > 0,
      detail: `Monthly cash flow is $${result.monthlyCashFlow.toFixed(0)} at ${inputs.occupancyPercent.toFixed(0)}% occupancy.`,
      weight: 25,
    },
    {
      label: "Cash-on-cash return ≥ 12% (STR target is higher than LTR)",
      pass: result.cashOnCashReturnPercent >= 12,
      detail: `Cash-on-cash return is ${result.cashOnCashReturnPercent.toFixed(1)}%.`,
      weight: 20,
    },
    {
      label: "DSCR ≥ 1.25",
      pass: result.dscr >= 1.25,
      detail: `DSCR is ${Number.isFinite(result.dscr) ? result.dscr.toFixed(2) : "∞ (no debt)"}.`,
      weight: 15,
    },
    {
      label: "Cap rate ≥ 6%",
      pass: result.capRatePercent >= 6,
      detail: `Cap rate is ${result.capRatePercent.toFixed(1)}%.`,
      weight: 10,
    },
    {
      label: "Manageable regulatory risk",
      pass: inputs.strRegulationRisk !== "restricted-capped",
      detail: `Regulation status entered: ${STR_REGULATION_LABELS[inputs.strRegulationRisk]}.`,
      weight: 15,
    },
    {
      label: "≥15-point occupancy cushion before break-even",
      pass: occupancyCushion,
      detail: Number.isFinite(result.breakEvenOccupancyPercent)
        ? `Break-even occupancy is ~${result.breakEvenOccupancyPercent.toFixed(0)}% vs. your ${inputs.occupancyPercent.toFixed(0)}% assumption.`
        : "Fixed costs and revenue scale together — break-even occupancy couldn't be isolated for this input combination.",
      weight: 15,
    },
  ];

  let bonus = 0;
  if (result.cashOnCashReturnPercent >= 20) bonus += 5;
  if (result.dscr >= 1.5) bonus += 5;

  return computeVerdict(criteria, bonus, SUMMARIES, {
    triggered: result.monthlyCashFlow <= 0 && result.cashOnCashReturnPercent < 0,
    summary:
      "This deal loses money at the assumed occupancy. Re-check your ADR and occupancy assumptions against real comps, or this doesn't work as an STR.",
  });
}

export const DEFAULT_STR_INPUTS: ShortTermRentalInputs = {
  address: "",
  purchasePrice: 425000,
  downPaymentPercent: 20,
  interestRatePercent: 7,
  loanTermYears: 30,
  closingCostPercent: 3,
  loanPointsPercent: 0,
  furnishingSetupCost: 25000,

  averageDailyRate: 220,
  occupancyPercent: 60,
  avgNightsPerStay: 3,
  cleaningFeePerStay: 120,
  cleaningCostPerStay: 100,
  otherMonthlyIncome: 0,

  platformFeePercent: 3,
  managementPercent: 20,
  suppliesMonthly: 80,
  utilitiesMonthlyOwnerPaid: 250,
  internetCableMonthly: 80,
  otherMonthlyOperatingCosts: 100,

  propertyTaxAnnual: 5200,
  insuranceAnnual: 3200,
  hoaMonthly: 0,
  strPermitAnnualFee: 500,

  maintenancePercent: 5,
  capExPercent: 6,

  strRegulationRisk: "permit-required",
  comparableLongTermMonthlyRent: 2400,

  annualRevenueGrowthPercent: 3,
  annualExpenseGrowthPercent: 3,
  annualAppreciationPercent: 3.5,
  sellingCostPercent: 7,
  holdPeriodYears: 10,
};
