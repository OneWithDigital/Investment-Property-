import { describe, expect, it } from "vitest";
import { analyzeDuplex, DEFAULT_DUPLEX_INPUTS } from "../lib/calc/duplex";
import { analyzeMultiUnit, DEFAULT_MULTI_UNIT_INPUTS } from "../lib/calc/multiUnit";
import { analyzeCommercial, DEFAULT_COMMERCIAL_INPUTS } from "../lib/calc/commercial";
import { analyzeShortTermRental, DEFAULT_STR_INPUTS } from "../lib/calc/shortTermRental";
import type { DuplexInputs } from "../lib/calc/duplex";
import type { MultiUnitInputs } from "../lib/calc/multiUnit";
import type { CommercialInputs } from "../lib/calc/commercial";
import type { ShortTermRentalInputs } from "../lib/calc/shortTermRental";

describe("analyzeDuplex — all-cash, fully-rented investor scenario", () => {
  const inputs: DuplexInputs = {
    ...DEFAULT_DUPLEX_INPUTS,
    financingType: "investor",
    purchasePrice: 200000,
    downPaymentPercent: 100,
    closingCostPercent: 0,
    rehabCost: 0,
    units: [
      { label: "A", monthlyRent: 1500, ownerOccupied: false },
      { label: "B", monthlyRent: 1500, ownerOccupied: false },
    ],
    otherMonthlyIncome: 0,
    comparableMarketRentForYourUnit: 0,
    propertyTaxAnnual: 0,
    insuranceAnnual: 0,
    hoaMonthly: 0,
    utilitiesMonthlyOwnerPaid: 0,
    maintenancePercent: 0,
    capExPercent: 0,
    vacancyPercent: 0,
    managementPercent: 0,
    holdPeriodYears: 1,
  };
  const result = analyzeDuplex(inputs);

  it("collects rent from both units", () => {
    expect(result.actualMonthlyRentCollected).toBeCloseTo(3000, 6);
    expect(result.fullMarketMonthlyRent).toBeCloseTo(3000, 6);
  });

  it("computes an 18% cap rate off $36k NOI on a $200k purchase", () => {
    expect(result.annualNoi).toBeCloseTo(36000, 1);
    expect(result.capRatePercent).toBeCloseTo(18, 6);
  });

  it("has cash-on-cash equal to cap rate with no leverage", () => {
    expect(result.cashOnCashReturnPercent).toBeCloseTo(18, 6);
  });

  it("computes the 1% rule off full market rent", () => {
    expect(result.onePercentRulePercent).toBeCloseTo(1.5, 6);
  });

  it("is not flagged as house-hacking", () => {
    expect(result.isHouseHacking).toBe(false);
  });
});

describe("analyzeDuplex — house-hack scenario", () => {
  const inputs: DuplexInputs = {
    ...DEFAULT_DUPLEX_INPUTS,
    financingType: "house-hack",
    purchasePrice: 300000,
    downPaymentPercent: 5,
    interestRatePercent: 0,
    loanTermYears: 30,
    closingCostPercent: 0,
    rehabCost: 0,
    units: [
      { label: "A (you)", monthlyRent: 1500, ownerOccupied: true },
      { label: "B", monthlyRent: 1500, ownerOccupied: false },
    ],
    otherMonthlyIncome: 0,
    comparableMarketRentForYourUnit: 1500,
    propertyTaxAnnual: 0,
    insuranceAnnual: 0,
    hoaMonthly: 0,
    utilitiesMonthlyOwnerPaid: 0,
    maintenancePercent: 0,
    capExPercent: 0,
    vacancyPercent: 0,
    managementPercent: 0,
    holdPeriodYears: 1,
  };
  const result = analyzeDuplex(inputs);

  it("only collects rent from the non-owner-occupied unit", () => {
    expect(result.actualMonthlyRentCollected).toBeCloseTo(1500, 6);
    expect(result.fullMarketMonthlyRent).toBeCloseTo(3000, 6);
  });

  it("computes a 0% interest straight-line P&I payment on the loan", () => {
    // loan = 300000 * 0.95 = 285000, 0% interest over 360 months
    expect(result.loanAmount).toBeCloseTo(285000, 6);
    expect(result.monthlyPrincipalAndInterest).toBeCloseTo(285000 / 360, 2);
  });

  it("shows a negative effective housing cost (tenant pays more than the mortgage)", () => {
    // effective housing cost = totalMonthlyOutflow - actualRentCollected
    const expected = 285000 / 360 - 1500;
    expect(result.effectiveMonthlyHousingCost).toBeCloseTo(expected, 2);
    expect(result.effectiveMonthlyHousingCost).toBeLessThan(0);
  });

  it("flags this as house-hacking", () => {
    expect(result.isHouseHacking).toBe(true);
  });
});

describe("analyzeMultiUnit — priced exactly at market cap rate", () => {
  const inputs: MultiUnitInputs = {
    ...DEFAULT_MULTI_UNIT_INPUTS,
    purchasePrice: 1000000,
    unitMix: [{ label: "1BR", count: 10, avgMonthlyRent: 1000 }],
    otherMonthlyIncome: 0,
    downPaymentPercent: 100,
    closingCostPercent: 0,
    rehabCost: 0,
    propertyTaxAnnual: 0,
    insuranceAnnual: 0,
    payrollAnnual: 0,
    commonAreaUtilitiesMonthly: 0,
    otherOpExMonthly: 0,
    managementPercent: 0,
    economicVacancyPercent: 0,
    capExReservePerUnitAnnual: 0,
    marketCapRatePercent: 12,
    holdPeriodYears: 1,
  };
  const result = analyzeMultiUnit(inputs);

  it("computes GPR and NOI correctly with no vacancy/opex", () => {
    expect(result.grossPotentialRentAnnual).toBeCloseTo(120000, 6);
    expect(result.noiAnnual).toBeCloseTo(120000, 6);
  });

  it("computes a 12% cap rate", () => {
    expect(result.capRatePercent).toBeCloseTo(12, 6);
  });

  it("shows 0% over/under-priced when purchase price equals implied value", () => {
    expect(result.impliedValue).toBeCloseTo(1000000, 1);
    expect(result.overUnderPricedPercent).toBeCloseTo(0, 3);
  });

  it("computes price per unit", () => {
    expect(result.pricePerUnit).toBeCloseTo(100000, 6);
  });

  it("has cash-on-cash equal to cap rate with no leverage", () => {
    expect(result.cashOnCashReturnPercent).toBeCloseTo(12, 6);
  });
});

describe("analyzeCommercial — single fully-leased NNN tenant", () => {
  const inputs: CommercialInputs = {
    ...DEFAULT_COMMERCIAL_INPUTS,
    purchasePrice: 1000000,
    buildingSqft: 10000,
    tenants: [{ name: "T1", sqftLeased: 10000, annualRentPerSqft: 12, leaseYearsRemaining: 5 }],
    vacantSqft: 0,
    marketRentPerSqftAnnual: 12,
    otherMonthlyIncome: 0,
    reimbursementPercent: 0,
    downPaymentPercent: 100,
    closingCostPercent: 0,
    rehabCost: 0,
    propertyTaxAnnual: 0,
    insuranceAnnual: 0,
    camAnnual: 0,
    managementPercent: 0,
    creditLossPercent: 0,
    holdPeriodYears: 1,
  };
  const result = analyzeCommercial(inputs);

  it("computes 100% occupancy and correct price/rent per sqft", () => {
    expect(result.occupancyPercent).toBeCloseTo(100, 6);
    expect(result.pricePerSqft).toBeCloseTo(100, 6);
    expect(result.avgInPlaceRentPerSqft).toBeCloseTo(12, 6);
  });

  it("computes WALT equal to the single tenant's remaining term", () => {
    expect(result.waltYears).toBeCloseTo(5, 6);
  });

  it("computes NOI and a 12% cap rate with zero reimbursement/opex", () => {
    expect(result.noiAnnual).toBeCloseTo(120000, 6);
    expect(result.capRatePercent).toBeCloseTo(12, 6);
  });

  it("has cash-on-cash equal to cap rate with no leverage", () => {
    expect(result.cashOnCashReturnPercent).toBeCloseTo(12, 6);
  });
});

describe("analyzeShortTermRental — revenue model and break-even occupancy", () => {
  const cashInputs: ShortTermRentalInputs = {
    ...DEFAULT_STR_INPUTS,
    purchasePrice: 300000,
    downPaymentPercent: 100,
    closingCostPercent: 0,
    furnishingSetupCost: 0,
    averageDailyRate: 200,
    occupancyPercent: 50,
    avgNightsPerStay: 3.65,
    cleaningFeePerStay: 0,
    cleaningCostPerStay: 0,
    otherMonthlyIncome: 0,
    platformFeePercent: 0,
    managementPercent: 0,
    suppliesMonthly: 0,
    utilitiesMonthlyOwnerPaid: 0,
    internetCableMonthly: 0,
    otherMonthlyOperatingCosts: 0,
    propertyTaxAnnual: 0,
    insuranceAnnual: 0,
    hoaMonthly: 0,
    strPermitAnnualFee: 0,
    maintenancePercent: 0,
    capExPercent: 0,
    strRegulationRisk: "unrestricted",
    comparableLongTermMonthlyRent: 0,
    holdPeriodYears: 1,
  };
  const cashResult = analyzeShortTermRental(cashInputs);

  it("computes gross booking revenue as ADR * 365 * occupancy", () => {
    expect(cashResult.grossBookingRevenueAnnual).toBeCloseTo(200 * 365 * 0.5, 1);
  });

  it("computes number of stays per year from occupancy and avg nights/stay", () => {
    expect(cashResult.numberOfStaysPerYear).toBeCloseTo(50, 1);
  });

  it("has cash-on-cash equal to cap rate with no leverage and zero expenses", () => {
    expect(cashResult.cashOnCashReturnPercent).toBeCloseTo(cashResult.capRatePercent, 6);
  });

  it("computes a break-even occupancy consistent with a leveraged, fixed-cost scenario", () => {
    const leveragedInputs: ShortTermRentalInputs = {
      ...cashInputs,
      downPaymentPercent: 20,
      interestRatePercent: 0,
      loanTermYears: 30,
      propertyTaxAnnual: 4000,
    };
    const result = analyzeShortTermRental(leveragedInputs);
    // loan = 240000, 0% interest / 360 months => annual debt service = 8000
    // fixed opex = 4000 (property tax only)
    // at 100% occupancy: revenue = 200*365 = 73000, cash flow = 73000-4000-8000 = 61000
    // at 0% occupancy: cash flow = 0-4000-8000 = -12000
    // break-even = 12000 / (61000+12000) * 100
    const expectedBreakEven = (12000 / 73000) * 100;
    expect(result.breakEvenOccupancyPercent).toBeCloseTo(expectedBreakEven, 2);

    // Sanity check: cash flow at that occupancy should be ~0.
    const atBreakEven: ShortTermRentalInputs = {
      ...leveragedInputs,
      occupancyPercent: expectedBreakEven,
    };
    const breakEvenResult = analyzeShortTermRental(atBreakEven);
    expect(breakEvenResult.monthlyCashFlow).toBeCloseTo(0, 1);
  });
});
