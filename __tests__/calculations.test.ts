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
    expect(lastYear?.endingBalance).toBeCloseTo(0, 1);
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

describe("analyzeProperty — loan points", () => {
  it("defaults to zero points cost, unchanged cash needed to close", () => {
    const inputs: PropertyInputs = { ...DEFAULT_INPUTS, purchasePrice: 300000, downPaymentPercent: 20 };
    const result = analyzeProperty(inputs);
    expect(result.loanPointsCost).toBe(0);
  });

  it("adds points cost (% of loan amount) to cash needed to close, not the down payment", () => {
    const withoutPoints = analyzeProperty({
      ...DEFAULT_INPUTS,
      purchasePrice: 300000,
      downPaymentPercent: 20,
      loanPointsPercent: 0,
    });
    const withPoints = analyzeProperty({
      ...DEFAULT_INPUTS,
      purchasePrice: 300000,
      downPaymentPercent: 20,
      loanPointsPercent: 2,
    });
    // loan amount = 240,000; 2 points = $4,800
    expect(withPoints.loanPointsCost).toBeCloseTo(4800, 6);
    expect(withPoints.downPaymentAmount).toBeCloseTo(withoutPoints.downPaymentAmount, 6);
    expect(withPoints.totalCashInvested).toBeCloseTo(withoutPoints.totalCashInvested + 4800, 6);
    // Points are a one-time closing cost, not a recurring expense —
    // monthly cash flow shouldn't change.
    expect(withPoints.monthlyCashFlow).toBeCloseTo(withoutPoints.monthlyCashFlow, 6);
  });
});

describe("analyzeProperty — PMI", () => {
  it("does not charge PMI at 20%+ down, even if a rate is entered", () => {
    const result = analyzeProperty({
      ...DEFAULT_INPUTS,
      purchasePrice: 300000,
      downPaymentPercent: 20,
      pmiMonthlyPercent: 0.75,
    });
    expect(result.monthlyPmi).toBe(0);
    expect(result.pmiDropsAfterYear).toBeNull();
  });

  it("does not charge PMI when the rate is 0, even below 20% down", () => {
    const result = analyzeProperty({
      ...DEFAULT_INPUTS,
      purchasePrice: 300000,
      downPaymentPercent: 10,
      pmiMonthlyPercent: 0,
    });
    expect(result.monthlyPmi).toBe(0);
  });

  it("charges monthly PMI as annual rate x loan amount / 12 below 20% down", () => {
    const result = analyzeProperty({
      ...DEFAULT_INPUTS,
      purchasePrice: 300000,
      downPaymentPercent: 10,
      pmiMonthlyPercent: 0.6,
    });
    // loan amount = 270,000; 0.6%/yr / 12 = $135/mo
    expect(result.monthlyPmi).toBeCloseTo(135, 6);
  });

  it("reduces monthly cash flow but leaves DSCR unaffected (PMI isn't debt service)", () => {
    const shared = {
      ...DEFAULT_INPUTS,
      purchasePrice: 300000,
      downPaymentPercent: 10,
      monthlyRent: 2200,
    };
    const withoutPmi = analyzeProperty({ ...shared, pmiMonthlyPercent: 0 });
    const withPmi = analyzeProperty({ ...shared, pmiMonthlyPercent: 0.6 });
    expect(withPmi.monthlyCashFlow).toBeCloseTo(withoutPmi.monthlyCashFlow - 135, 6);
    expect(withPmi.dscr).toBeCloseTo(withoutPmi.dscr, 6);
  });

  it("auto-cancels once the amortized balance falls to 80% of the original purchase price", () => {
    // A short, high-payment loan term so the 80% LTV crossover happens
    // within a modeled hold period, and is independently derivable from
    // amortizationSchedule (already covered by its own tests elsewhere)
    // rather than hand-computed here.
    const inputs: PropertyInputs = {
      ...DEFAULT_INPUTS,
      purchasePrice: 300000,
      downPaymentPercent: 10,
      interestRatePercent: 6,
      loanTermYears: 5,
      pmiMonthlyPercent: 0.6,
      holdPeriodYears: 5,
    };
    const loanAmount = inputs.purchasePrice * 0.9;
    const amort = amortizationSchedule(loanAmount, inputs.interestRatePercent, inputs.loanTermYears, 5);
    // amort is 0-indexed by array position but 1-indexed by `.year`;
    // findIndex's 0-based result equals (1-indexed year - 1) of the
    // first year whose *beginning* balance is already at/under 80% LTV —
    // which is exactly one less than that year number, i.e. the last
    // year PMI was still charged.
    const firstYearGone = amort.findIndex((y) => y.beginningBalance / inputs.purchasePrice <= 0.8);

    const result = analyzeProperty(inputs);

    if (firstYearGone === -1) {
      // Loan never crosses 80% LTV within the modeled years — PMI stays on.
      expect(result.pmiDropsAfterYear).toBeNull();
    } else {
      expect(result.pmiDropsAfterYear).toBe(firstYearGone); // 0-indexed findIndex == 1-indexed prior year
    }

    // Whatever year it drops, later years' cash flow should be higher
    // than earlier years' by roughly the monthly PMI x 12 once it's gone
    // (sanity check on direction, not exact — other growth factors move too).
    if (result.pmiDropsAfterYear !== null) {
      const beforeDrop = result.projection[result.pmiDropsAfterYear - 1];
      const afterDrop = result.projection[result.pmiDropsAfterYear];
      expect(beforeDrop).toBeDefined();
      expect(afterDrop).toBeDefined();
      if (beforeDrop && afterDrop) {
        expect(afterDrop.cashFlow).toBeGreaterThan(beforeDrop.cashFlow);
      }
    }
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
