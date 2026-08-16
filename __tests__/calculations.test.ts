import { describe, expect, it } from "vitest";
import {
  amortizationSchedule,
  analyzeProperty,
  calculateIrr,
  monthlyPrincipalAndInterest,
} from "../lib/calculations";
import { DEFAULT_INPUTS } from "../lib/calculations";
import type { PropertyInputs } from "../lib/types";

describe("monthlyPrincipalAndInterest", () => {
  it("matches the well-known $200k / 6% / 30yr reference payment of $1,199.10", () => {
    const payment = monthlyPrincipalAndInterest(200000, 6, 30);
    expect(payment).toBeCloseTo(1199.1, 1);
  });

  it("handles 0% interest as a simple straight-line payment", () => {
    const payment = monthlyPrincipalAndInterest(120000, 0, 10);
    expect(payment).toBeCloseTo(120000 / 120, 6);
  });

  it("returns 0 for a fully cash purchase (no loan)", () => {
    expect(monthlyPrincipalAndInterest(0, 6, 30)).toBe(0);
  });
});

describe("amortizationSchedule", () => {
  it("fully pays off the loan by the end of the term", () => {
    const schedule = amortizationSchedule(200000, 6, 30, 30);
    const lastYear = schedule[schedule.length - 1];
    expect(lastYear.endingBalance).toBeCloseTo(0, 1);
  });

  it("principal paid + ending balance equals beginning balance each year", () => {
    const schedule = amortizationSchedule(200000, 6, 30, 5);
    for (const year of schedule) {
      expect(year.beginningBalance - year.principalPaid).toBeCloseTo(
        year.endingBalance,
        4
      );
    }
  });
});

describe("calculateIrr", () => {
  it("solves a simple single-period 10% return", () => {
    const irr = calculateIrr([-1000, 1100]);
    expect(irr).not.toBeNull();
    expect(irr!).toBeCloseTo(10, 2);
  });

  it("solves a simple two-period doubling investment", () => {
    // -1000 today, 0 in year 1, 1210 in year 2 => IRR = 10%
    const irr = calculateIrr([-1000, 0, 1210]);
    expect(irr).not.toBeNull();
    expect(irr!).toBeCloseTo(10, 1);
  });
});

describe("analyzeProperty — all-cash purchase", () => {
  const inputs: PropertyInputs = {
    ...DEFAULT_INPUTS,
    purchasePrice: 100000,
    downPaymentPercent: 100,
    interestRatePercent: 6,
    loanTermYears: 30,
    closingCostPercent: 0,
    rehabCost: 0,
    monthlyRent: 1000,
    otherMonthlyIncome: 0,
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
  const result = analyzeProperty(inputs);

  it("has zero debt service and zero loan amount", () => {
    expect(result.loanAmount).toBe(0);
    expect(result.monthlyPrincipalAndInterest).toBe(0);
  });

  it("computes a 12% cap rate", () => {
    expect(result.capRatePercent).toBeCloseTo(12, 6);
  });

  it("computes cash-on-cash return equal to cap rate (no leverage)", () => {
    expect(result.cashOnCashReturnPercent).toBeCloseTo(12, 6);
  });

  it("has infinite DSCR with no debt service", () => {
    expect(result.dscr).toBe(Infinity);
  });

  it("computes the 1% rule ratio correctly", () => {
    expect(result.onePercentRulePercent).toBeCloseTo(1.0, 6);
  });
});

describe("analyzeProperty — financed purchase", () => {
  const inputs: PropertyInputs = {
    ...DEFAULT_INPUTS,
    purchasePrice: 100000,
    downPaymentPercent: 20,
    interestRatePercent: 6,
    loanTermYears: 30,
    closingCostPercent: 0,
    rehabCost: 0,
    monthlyRent: 1500,
    otherMonthlyIncome: 0,
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
  const result = analyzeProperty(inputs);

  it("computes an $80,000 loan and ~$479.64 P&I payment", () => {
    expect(result.loanAmount).toBeCloseTo(80000, 6);
    expect(result.monthlyPrincipalAndInterest).toBeCloseTo(479.64, 1);
  });

  it("computes NOI as gross rent (no opex in this scenario)", () => {
    expect(result.annualNoi).toBeCloseTo(18000, 1);
  });

  it("computes cap rate off NOI, independent of financing", () => {
    expect(result.capRatePercent).toBeCloseTo(18, 6);
  });

  it("computes DSCR = NOI / annual debt service", () => {
    const expectedDscr = 18000 / (result.monthlyPrincipalAndInterest * 12);
    expect(result.dscr).toBeCloseTo(expectedDscr, 6);
    expect(result.dscr).toBeGreaterThan(3);
  });

  it("computes cash-on-cash return using total cash invested", () => {
    const expectedCashFlow =
      (18000 - result.monthlyPrincipalAndInterest * 12) / result.totalCashInvested;
    expect(result.cashOnCashReturnPercent / 100).toBeCloseTo(expectedCashFlow, 6);
  });
});

describe("analyzeProperty — negative cash flow deal", () => {
  it("flags negative monthly cash flow when expenses exceed income", () => {
    const inputs: PropertyInputs = {
      ...DEFAULT_INPUTS,
      purchasePrice: 500000,
      downPaymentPercent: 10,
      interestRatePercent: 7.5,
      monthlyRent: 2000,
      propertyTaxAnnual: 8000,
      insuranceAnnual: 3000,
      holdPeriodYears: 1,
    };
    const result = analyzeProperty(inputs);
    expect(result.monthlyCashFlow).toBeLessThan(0);
  });
});
