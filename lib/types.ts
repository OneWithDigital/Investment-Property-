export interface PropertyInputs {
  address: string;
  purchasePrice: number;
  downPaymentPercent: number; // 0-100
  interestRatePercent: number; // annual, 0-100
  loanTermYears: number;
  closingCostPercent: number; // 0-100, % of purchase price
  loanPointsPercent: number; // 0-100, upfront lender fee as % of loan amount
  pmiMonthlyPercent: number; // 0-100, annual PMI rate as % of loan amount; only charged while down payment < 20% and remaining balance > 80% of purchase price
  rehabCost: number;

  monthlyRent: number;
  otherMonthlyIncome: number;

  propertyTaxAnnual: number;
  insuranceAnnual: number;
  hoaMonthly: number;
  utilitiesMonthlyOwnerPaid: number;

  maintenancePercent: number; // % of rent
  capExPercent: number; // % of rent
  vacancyPercent: number; // % of rent
  managementPercent: number; // % of rent, 0 if self-managed

  annualRentGrowthPercent: number;
  annualExpenseGrowthPercent: number;
  annualAppreciationPercent: number;
  sellingCostPercent: number; // % of sale price at exit
  holdPeriodYears: number;
}

export interface AmortizationYear {
  year: number;
  beginningBalance: number;
  principalPaid: number;
  interestPaid: number;
  endingBalance: number;
}

export interface ProjectionYear {
  year: number;
  grossRent: number;
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

export interface CalculationResult {
  loanAmount: number;
  downPaymentAmount: number;
  closingCosts: number;
  loanPointsCost: number;
  totalCashInvested: number;

  monthlyPrincipalAndInterest: number;
  monthlyPmi: number;
  /** First projection year (1-indexed) PMI is no longer charged; null if it never applies, or doesn't drop off within the modeled hold period. */
  pmiDropsAfterYear: number | null;
  monthlyPropertyTax: number;
  monthlyInsurance: number;
  monthlyHoa: number;
  monthlyMaintenance: number;
  monthlyCapEx: number;
  monthlyVacancyLoss: number;
  monthlyManagement: number;
  monthlyUtilities: number;
  totalMonthlyOperatingExpenses: number;
  totalMonthlyDebtService: number;
  totalMonthlyOutflow: number;

  monthlyGrossRent: number;
  effectiveGrossMonthlyIncome: number;
  monthlyNoi: number;
  annualNoi: number;
  monthlyCashFlow: number;
  annualCashFlow: number;

  capRatePercent: number;
  cashOnCashReturnPercent: number;
  dscr: number;
  grossRentMultiplier: number;
  onePercentRulePercent: number; // rent / price * 100
  fiftyPercentRuleExpensesPercent: number; // opex(excl debt) / gross rent * 100
  breakEvenRatioPercent: number;
  debtYieldPercent: number;

  projection: ProjectionYear[];
  irrPercent: number | null;
  netSaleProceedsAtExit: number;
  totalReturnAtExit: number;
  equityMultiple: number;
}

export type VerdictLabel =
  | "Strong Buy"
  | "Good Investment"
  | "Marginal — Negotiate"
  | "Pass";

export interface VerdictCriterion {
  label: string;
  pass: boolean;
  detail: string;
}

export interface Verdict {
  label: VerdictLabel;
  score: number; // 0-100
  criteria: VerdictCriterion[];
  summary: string;
}

export interface ZillowLookupResult {
  address: string | null;
  zpid: string | null;
  price: number | null;
  bedrooms: number | null;
  bathrooms: number | null;
  livingAreaSqft: number | null;
  propertyTaxAnnual: number | null;
  hoaMonthly: number | null;
  rentZestimate: number | null;
  zestimate: number | null;
  yearBuilt: number | null;
  homeType: string | null;
  fetched: boolean;
  fetchError: string | null;
}
