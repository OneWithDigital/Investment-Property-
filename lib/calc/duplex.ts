import {
  amortizationSchedule,
  calculateIrr,
  monthlyPrincipalAndInterest,
} from "@/lib/calculations";
import { computeVerdict, type WeightedCriterion } from "@/lib/verdict/scoreCriteria";
import type { ProjectionYear, Verdict, VerdictLabel } from "@/lib/types";

export interface RentalUnit {
  label: string;
  monthlyRent: number;
  ownerOccupied: boolean;
}

export type DuplexFinancingType = "investor" | "house-hack";

export interface DuplexInputs {
  address: string;
  financingType: DuplexFinancingType;
  purchasePrice: number;
  downPaymentPercent: number;
  interestRatePercent: number;
  loanTermYears: number;
  closingCostPercent: number;
  rehabCost: number;

  units: RentalUnit[];
  otherMonthlyIncome: number;
  comparableMarketRentForYourUnit: number;

  propertyTaxAnnual: number;
  insuranceAnnual: number;
  hoaMonthly: number;
  utilitiesMonthlyOwnerPaid: number;

  maintenancePercent: number;
  capExPercent: number;
  vacancyPercent: number;
  managementPercent: number;

  annualRentGrowthPercent: number;
  annualExpenseGrowthPercent: number;
  annualAppreciationPercent: number;
  sellingCostPercent: number;
  holdPeriodYears: number;
}

export interface DuplexResult {
  totalUnits: number;
  actualMonthlyRentCollected: number;
  fullMarketMonthlyRent: number;

  loanAmount: number;
  downPaymentAmount: number;
  closingCosts: number;
  totalCashInvested: number;

  monthlyPrincipalAndInterest: number;
  totalMonthlyOperatingExpenses: number;
  totalMonthlyOutflow: number;

  monthlyNoi: number;
  annualNoi: number;
  monthlyCashFlow: number;
  annualCashFlow: number;

  capRatePercent: number;
  cashOnCashReturnPercent: number;
  dscr: number;
  onePercentRulePercent: number;
  breakEvenRatioPercent: number;
  pricePerUnit: number;

  isHouseHacking: boolean;
  effectiveMonthlyHousingCost: number;
  housingSavingsVsRentingMonthly: number;

  fullyRentedMonthlyCashFlow: number;
  fullyRentedCapRatePercent: number;

  projection: ProjectionYear[];
  irrPercent: number | null;
  netSaleProceedsAtExit: number;
  totalReturnAtExit: number;
  equityMultiple: number;
}

function operatingExpenses(
  inputs: DuplexInputs,
  rentBase: number
): number {
  return (
    inputs.propertyTaxAnnual / 12 +
    inputs.insuranceAnnual / 12 +
    inputs.hoaMonthly +
    rentBase * (inputs.maintenancePercent / 100) +
    rentBase * (inputs.capExPercent / 100) +
    rentBase * (inputs.managementPercent / 100) +
    inputs.utilitiesMonthlyOwnerPaid
  );
}

export function analyzeDuplex(inputs: DuplexInputs): DuplexResult {
  const totalUnits = inputs.units.length;
  const actualMonthlyRentCollected = inputs.units
    .filter((u) => !u.ownerOccupied)
    .reduce((sum, u) => sum + u.monthlyRent, 0);
  const fullMarketMonthlyRent = inputs.units.reduce((sum, u) => sum + u.monthlyRent, 0);
  const isHouseHacking =
    inputs.financingType === "house-hack" && inputs.units.some((u) => u.ownerOccupied);

  const downPaymentAmount = inputs.purchasePrice * (inputs.downPaymentPercent / 100);
  const loanAmount = inputs.purchasePrice - downPaymentAmount;
  const closingCosts = inputs.purchasePrice * (inputs.closingCostPercent / 100);
  const totalCashInvested = downPaymentAmount + closingCosts + inputs.rehabCost;

  const pAndI = monthlyPrincipalAndInterest(
    loanAmount,
    inputs.interestRatePercent,
    inputs.loanTermYears
  );

  const vacancyLoss = actualMonthlyRentCollected * (inputs.vacancyPercent / 100);
  const effectiveGrossMonthlyIncome =
    actualMonthlyRentCollected - vacancyLoss + inputs.otherMonthlyIncome;
  const opEx = operatingExpenses(inputs, actualMonthlyRentCollected);
  const monthlyNoi = effectiveGrossMonthlyIncome - opEx;
  const annualNoi = monthlyNoi * 12;
  const monthlyCashFlow = monthlyNoi - pAndI;
  const annualCashFlow = monthlyCashFlow * 12;
  const totalMonthlyOutflow = opEx + pAndI;

  const capRatePercent =
    inputs.purchasePrice > 0 ? (annualNoi / inputs.purchasePrice) * 100 : 0;
  const cashOnCashReturnPercent =
    totalCashInvested > 0 ? (annualCashFlow / totalCashInvested) * 100 : 0;
  const annualDebtService = pAndI * 12;
  const dscr = annualDebtService > 0 ? annualNoi / annualDebtService : Infinity;
  const onePercentRulePercent =
    inputs.purchasePrice > 0 ? (fullMarketMonthlyRent / inputs.purchasePrice) * 100 : 0;
  const grossPotentialIncome = actualMonthlyRentCollected + inputs.otherMonthlyIncome;
  const breakEvenRatioPercent =
    grossPotentialIncome > 0 ? (totalMonthlyOutflow / grossPotentialIncome) * 100 : 0;
  const pricePerUnit = totalUnits > 0 ? inputs.purchasePrice / totalUnits : 0;

  const effectiveMonthlyHousingCost = totalMonthlyOutflow - actualMonthlyRentCollected;
  const housingSavingsVsRentingMonthly =
    inputs.comparableMarketRentForYourUnit - effectiveMonthlyHousingCost;

  // "If fully rented" scenario: what this looks like once the owner
  // moves out and every unit is tenant-occupied.
  const fullyRentedVacancyLoss = fullMarketMonthlyRent * (inputs.vacancyPercent / 100);
  const fullyRentedEffectiveIncome =
    fullMarketMonthlyRent - fullyRentedVacancyLoss + inputs.otherMonthlyIncome;
  const fullyRentedOpEx = operatingExpenses(inputs, fullMarketMonthlyRent);
  const fullyRentedNoi = fullyRentedEffectiveIncome - fullyRentedOpEx;
  const fullyRentedMonthlyCashFlow = fullyRentedNoi - pAndI;
  const fullyRentedCapRatePercent =
    inputs.purchasePrice > 0 ? ((fullyRentedNoi * 12) / inputs.purchasePrice) * 100 : 0;

  // --- Multi-year projection (uses the as-occupied scenario) ---
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
    const growth = (rate: number) => Math.pow(1 + rate / 100, year - 1);
    const grossRentAnnual = actualMonthlyRentCollected * 12 * growth(inputs.annualRentGrowthPercent);
    const otherIncomeAnnual = inputs.otherMonthlyIncome * 12 * growth(inputs.annualRentGrowthPercent);
    const vacancyAnnual = grossRentAnnual * (inputs.vacancyPercent / 100);
    const effectiveGrossIncome = grossRentAnnual - vacancyAnnual + otherIncomeAnnual;

    const opExGrowthFactor = growth(inputs.annualExpenseGrowthPercent);
    const operatingExpensesYear =
      inputs.propertyTaxAnnual * opExGrowthFactor +
      inputs.insuranceAnnual * opExGrowthFactor +
      inputs.hoaMonthly * 12 * opExGrowthFactor +
      grossRentAnnual * (inputs.maintenancePercent / 100) +
      grossRentAnnual * (inputs.capExPercent / 100) +
      grossRentAnnual * (inputs.managementPercent / 100) +
      inputs.utilitiesMonthlyOwnerPaid * 12 * opExGrowthFactor;

    const noi = effectiveGrossIncome - operatingExpensesYear;
    const debtServiceYear = pAndI * 12;
    const cashFlow = noi - debtServiceYear;
    cumulativeCashFlow += cashFlow;

    const propertyValue = inputs.purchasePrice * growth(inputs.annualAppreciationPercent);
    const loanBalance = amort[year - 1]?.endingBalance ?? 0;
    const equity = propertyValue - loanBalance;

    projection.push({
      year,
      grossRent: grossRentAnnual,
      effectiveGrossIncome,
      operatingExpenses: operatingExpensesYear,
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

  const totalReturnAtExit = cumulativeCashFlow + netSaleProceedsAtExit - totalCashInvested;
  const equityMultiple =
    totalCashInvested > 0 ? (cumulativeCashFlow + netSaleProceedsAtExit) / totalCashInvested : 0;

  return {
    totalUnits,
    actualMonthlyRentCollected,
    fullMarketMonthlyRent,
    loanAmount,
    downPaymentAmount,
    closingCosts,
    totalCashInvested,
    monthlyPrincipalAndInterest: pAndI,
    totalMonthlyOperatingExpenses: opEx,
    totalMonthlyOutflow,
    monthlyNoi,
    annualNoi,
    monthlyCashFlow,
    annualCashFlow,
    capRatePercent,
    cashOnCashReturnPercent,
    dscr,
    onePercentRulePercent,
    breakEvenRatioPercent,
    pricePerUnit,
    isHouseHacking,
    effectiveMonthlyHousingCost,
    housingSavingsVsRentingMonthly,
    fullyRentedMonthlyCashFlow,
    fullyRentedCapRatePercent,
    projection,
    irrPercent,
    netSaleProceedsAtExit,
    totalReturnAtExit,
    equityMultiple,
  };
}

const SUMMARIES: Record<VerdictLabel, string> = {
  "Strong Buy":
    "This property clears standard small-multifamily benchmarks. If house-hacking, you're living for meaningfully less than market rent while building equity — confirm rent comps for each unit before moving forward.",
  "Good Investment":
    "Solid overall, though not exceptional on every metric. Worth pursuing, especially for the owner-occupant financing advantage (lower down payment) that pure investment purchases don't get.",
  "Marginal — Negotiate":
    "Thin margins. Negotiate price/terms and double-check each unit's rent against real comps — small multifamily rent estimates are easy to get wrong unit-by-unit.",
  Pass: "Doesn't clear the bar at these numbers. If house-hacking, compare the effective housing cost against what you'd actually pay to rent nearby before ruling it out entirely.",
};

export function evaluateDuplexVerdict(result: DuplexResult, inputs: DuplexInputs): Verdict {
  const criteria: WeightedCriterion[] = [];
  let gateTriggered = false;
  let gateSummary = "";

  if (result.isHouseHacking) {
    const livesForLessOrEqual = result.effectiveMonthlyHousingCost <= 0;
    criteria.push({
      label: "Tenants cover your full housing cost (or better)",
      pass: livesForLessOrEqual,
      detail: `Your effective monthly housing cost is $${result.effectiveMonthlyHousingCost.toFixed(0)} (negative means the tenants are paying you to live there).`,
      weight: 30,
    });
    if (inputs.comparableMarketRentForYourUnit > 0) {
      const beatsRenting = result.housingSavingsVsRentingMonthly > 0;
      criteria.push({
        label: "Cheaper than renting a comparable unit nearby",
        pass: beatsRenting,
        detail: `You'd save $${result.housingSavingsVsRentingMonthly.toFixed(0)}/month versus renting a comparable unit at $${inputs.comparableMarketRentForYourUnit.toFixed(0)}/month.`,
        weight: 15,
      });
    }
    gateTriggered = false;
  } else {
    const positiveCashFlow = result.monthlyCashFlow > 0;
    criteria.push({
      label: "Positive monthly cash flow",
      pass: positiveCashFlow,
      detail: `Monthly cash flow is $${result.monthlyCashFlow.toFixed(0)}.`,
      weight: 30,
    });
    gateTriggered = !positiveCashFlow;
    gateSummary =
      "This deal loses money every month as a straight rental. Renegotiate price/terms, raise rent, or consider house-hacking it instead.";
  }

  criteria.push({
    label: "Cash-on-cash return ≥ 8%",
    pass: result.cashOnCashReturnPercent >= 8,
    detail: `Cash-on-cash return is ${result.cashOnCashReturnPercent.toFixed(1)}%.`,
    weight: 20,
  });
  criteria.push({
    label: "Cap rate ≥ 6%",
    pass: result.capRatePercent >= 6,
    detail: `Cap rate is ${result.capRatePercent.toFixed(1)}% (based on actual rent collected).`,
    weight: 15,
  });
  criteria.push({
    label: "DSCR ≥ 1.25 (lender comfort zone)",
    pass: result.dscr >= 1.25,
    detail: `DSCR is ${Number.isFinite(result.dscr) ? result.dscr.toFixed(2) : "∞ (no debt)"}.`,
    weight: 10,
  });
  criteria.push({
    label: "Meets the 1% rule (full market rent ≥ 1% of price)",
    pass: result.onePercentRulePercent >= 1,
    detail: `Full market rent (all units) is ${result.onePercentRulePercent.toFixed(2)}% of purchase price.`,
    weight: 10,
  });
  criteria.push({
    label: "Break-even ratio ≤ 85%",
    pass: result.breakEvenRatioPercent <= 85,
    detail: `Break-even ratio is ${result.breakEvenRatioPercent.toFixed(0)}%.`,
    weight: 10,
  });

  let bonus = 0;
  if (result.cashOnCashReturnPercent >= 15) bonus += 5;
  if (result.dscr >= 1.5) bonus += 5;

  return computeVerdict(criteria, bonus, SUMMARIES, {
    triggered: gateTriggered,
    summary: gateSummary,
  });
}

export const DEFAULT_DUPLEX_INPUTS: DuplexInputs = {
  address: "",
  financingType: "house-hack",
  purchasePrice: 425000,
  downPaymentPercent: 5,
  interestRatePercent: 6.75,
  loanTermYears: 30,
  closingCostPercent: 3,
  rehabCost: 0,

  units: [
    { label: "Unit A (you)", monthlyRent: 1600, ownerOccupied: true },
    { label: "Unit B", monthlyRent: 1700, ownerOccupied: false },
  ],
  otherMonthlyIncome: 0,
  comparableMarketRentForYourUnit: 1600,

  propertyTaxAnnual: 5100,
  insuranceAnnual: 2200,
  hoaMonthly: 0,
  utilitiesMonthlyOwnerPaid: 0,

  maintenancePercent: 5,
  capExPercent: 5,
  vacancyPercent: 5,
  managementPercent: 0,

  annualRentGrowthPercent: 3,
  annualExpenseGrowthPercent: 2.5,
  annualAppreciationPercent: 3.5,
  sellingCostPercent: 7,
  holdPeriodYears: 10,
};
