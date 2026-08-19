import { describe, expect, it } from "vitest";
import {
  simulateHelocPaydown,
  recommendedHelocBuffer,
  DEFAULT_HELOC_INPUTS,
  type HelocPaydownInputs,
} from "../lib/calc/helocPaydown";
import { monthlyPrincipalAndInterest, amortizationSchedule } from "../lib/calculations";

describe("simulateHelocPaydown — minimum payments baseline", () => {
  it("matches the standard amortization schedule's total interest for a loan paid off in its term", () => {
    const inputs: HelocPaydownInputs = {
      ...DEFAULT_HELOC_INPUTS,
      mortgageBalance: 300000,
      mortgageRatePercent: 6,
      mortgageRemainingTermYears: 30,
      monthlyDiscretionaryIncome: 0,
      helocLimit: 0,
      helocBufferAmount: 0,
    };
    const result = simulateHelocPaydown(inputs);
    const payment = monthlyPrincipalAndInterest(300000, 6, 30);
    const schedule = amortizationSchedule(300000, 6, 30, 30);
    const expectedTotalInterest = schedule.reduce((sum, y) => sum + y.interestPaid, 0);

    expect(result.monthlyPayment).toBeCloseTo(payment, 6);
    expect(result.minimumPayments.monthsToMortgageFreedom).toBe(360);
    expect(result.minimumPayments.totalInterestPaid).toBeCloseTo(expectedTotalInterest, -1);
  });
});

describe("simulateHelocPaydown — extra principal payments", () => {
  it("pays off faster and with less interest than minimum payments", () => {
    const inputs: HelocPaydownInputs = {
      ...DEFAULT_HELOC_INPUTS,
      monthlyDiscretionaryIncome: 1000,
    };
    const result = simulateHelocPaydown(inputs);
    expect(result.extraPrincipal.monthsToMortgageFreedom).not.toBeNull();
    expect(result.minimumPayments.monthsToMortgageFreedom).not.toBeNull();
    expect(result.extraPrincipal.monthsToMortgageFreedom!).toBeLessThan(
      result.minimumPayments.monthsToMortgageFreedom!
    );
    expect(result.extraPrincipal.totalInterestPaid).toBeLessThan(
      result.minimumPayments.totalInterestPaid
    );
  });

  it("with zero discretionary income, behaves exactly like minimum payments", () => {
    const inputs: HelocPaydownInputs = {
      ...DEFAULT_HELOC_INPUTS,
      monthlyDiscretionaryIncome: 0,
    };
    const result = simulateHelocPaydown(inputs);
    expect(result.extraPrincipal.monthsToMortgageFreedom).toBe(
      result.minimumPayments.monthsToMortgageFreedom
    );
    expect(result.extraPrincipal.totalInterestPaid).toBeCloseTo(
      result.minimumPayments.totalInterestPaid,
      6
    );
  });
});

describe("recommendedHelocBuffer", () => {
  it("is 0 when there is no HELOC limit", () => {
    expect(recommendedHelocBuffer(0, 2000, "conservative")).toBe(0);
  });

  it("reserves at least 10% of the limit even for a tiny mortgage payment", () => {
    const buffer = recommendedHelocBuffer(50000, 10, "conservative");
    expect(buffer).toBeCloseTo(5000, 6);
  });

  it("scales with the mortgage payment once that exceeds the 10% floor", () => {
    const buffer = recommendedHelocBuffer(50000, 3000, "conservative");
    expect(buffer).toBeCloseTo(6000, 6); // 2 months of payment > 10% floor
  });

  it("recommends a larger buffer under full-pass-through than conservative", () => {
    const conservative = recommendedHelocBuffer(50000, 3000, "conservative");
    const fullPassThrough = recommendedHelocBuffer(50000, 3000, "full-pass-through");
    expect(fullPassThrough).toBeGreaterThan(conservative);
  });

  it("never recommends reserving more than 60% of the limit", () => {
    const buffer = recommendedHelocBuffer(10000, 50000, "full-pass-through");
    expect(buffer).toBeCloseTo(6000, 6);
  });
});

describe("simulateHelocPaydown — HELOC chunking (conservative style)", () => {
  it("pays off total debt (mortgage + HELOC) faster than minimum payments given real discretionary cash flow", () => {
    const inputs: HelocPaydownInputs = {
      ...DEFAULT_HELOC_INPUTS,
      monthlyDiscretionaryIncome: 1000,
    };
    const result = simulateHelocPaydown(inputs);
    expect(result.helocChunking.monthsToTotalFreedom).not.toBeNull();
    expect(result.minimumPayments.monthsToMortgageFreedom).not.toBeNull();
    expect(result.helocChunking.monthsToTotalFreedom!).toBeLessThan(
      result.minimumPayments.monthsToMortgageFreedom!
    );
    expect(result.helocChunking.chunkCount).toBeGreaterThan(0);
  });

  it("lands close to (not dramatically better than) the direct extra-principal strategy — the core velocity-banking insight", () => {
    const inputs: HelocPaydownInputs = {
      ...DEFAULT_HELOC_INPUTS,
      monthlyDiscretionaryIncome: 1000,
      helocRatePercent: DEFAULT_HELOC_INPUTS.mortgageRatePercent, // isolate the mechanism from a rate difference
    };
    const result = simulateHelocPaydown(inputs);
    const helocMonths = result.helocChunking.monthsToTotalFreedom!;
    const extraMonths = result.extraPrincipal.monthsToMortgageFreedom!;
    // within ~5% of each other when the HELOC and mortgage rates match
    expect(Math.abs(helocMonths - extraMonths) / extraMonths).toBeLessThan(0.05);
  });

  it("does nothing extra when the HELOC limit is 0 — degrades to minimum payments", () => {
    const inputs: HelocPaydownInputs = {
      ...DEFAULT_HELOC_INPUTS,
      monthlyDiscretionaryIncome: 1000,
      helocLimit: 0,
      helocBufferAmount: 0,
    };
    const result = simulateHelocPaydown(inputs);
    expect(result.helocChunking.chunkCount).toBe(0);
    expect(result.helocChunking.monthsToTotalFreedom).toBe(
      result.minimumPayments.monthsToMortgageFreedom
    );
  });

  it("a higher HELOC rate than the mortgage rate can make chunking worse than plain extra payments", () => {
    const inputs: HelocPaydownInputs = {
      ...DEFAULT_HELOC_INPUTS,
      mortgageRatePercent: 5,
      helocRatePercent: 12,
      monthlyDiscretionaryIncome: 500,
      helocLimit: 80000,
      helocBufferAmount: 0,
    };
    const result = simulateHelocPaydown(inputs);
    expect(result.helocChunking.totalInterestPaid).toBeGreaterThan(
      result.extraPrincipal.totalInterestPaid
    );
  });

  it("never exceeds the HELOC limit — chunk draws are always capped at available room", () => {
    const inputs: HelocPaydownInputs = {
      ...DEFAULT_HELOC_INPUTS,
      monthlyDiscretionaryIncome: 1000,
      cashFlowStyle: "conservative",
    };
    const result = simulateHelocPaydown(inputs);
    expect(result.helocChunking.everExceededHelocLimit).toBe(false);
  });
});

describe("simulateHelocPaydown — HELOC chunking (full-pass-through style)", () => {
  it("pays off at least as fast as the conservative style thanks to more frequent crediting", () => {
    const base: HelocPaydownInputs = {
      ...DEFAULT_HELOC_INPUTS,
      monthlyDiscretionaryIncome: 1000,
    };
    const conservative = simulateHelocPaydown({ ...base, cashFlowStyle: "conservative" });
    const fullPassThrough = simulateHelocPaydown({ ...base, cashFlowStyle: "full-pass-through" });
    expect(fullPassThrough.helocChunking.monthsToTotalFreedom!).toBeLessThanOrEqual(
      conservative.helocChunking.monthsToTotalFreedom!
    );
  });

  it("flags when funding the mortgage payment from a nearly-maxed HELOC would exceed the limit", () => {
    const inputs: HelocPaydownInputs = {
      ...DEFAULT_HELOC_INPUTS,
      mortgageBalance: 300000,
      helocLimit: 20000,
      helocBufferAmount: 0, // deliberately no buffer, to trigger the warning
      monthlyDiscretionaryIncome: 50, // too little to keep up with a big monthly mortgage draw
      cashFlowStyle: "full-pass-through",
    };
    const result = simulateHelocPaydown(inputs);
    expect(result.helocChunking.everExceededHelocLimit).toBe(true);
    expect(result.helocChunking.firstExceededMonth).not.toBeNull();
  });
});
