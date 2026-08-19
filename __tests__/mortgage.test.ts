import { describe, expect, it } from "vitest";
import {
  compareToBaseline,
  computeMortgage,
  getDefaultMortgageInputs,
} from "../lib/calc/mortgage";

describe("computeMortgage — standard 30-year loan, 20% down", () => {
  const inputs = {
    ...getDefaultMortgageInputs(),
    homePrice: 400000,
    downPaymentPercent: 20,
    interestRatePercent: 6,
    loanTermYears: 30,
    propertyTaxAnnual: 4800,
    homeInsuranceAnnual: 1200,
    hoaMonthly: 0,
    pmiAnnualPercent: 0.5,
  };
  const result = computeMortgage(inputs);

  it("computes the loan amount net of down payment", () => {
    expect(result.loanAmount).toBeCloseTo(320000, 6);
    expect(result.downPaymentAmount).toBeCloseTo(80000, 6);
  });

  it("skips PMI once LTV is at or below 80%", () => {
    expect(result.monthlyPmi).toBe(0);
    expect(result.totalPmiPaid).toBe(0);
  });

  it("amortizes fully within the loan term", () => {
    expect(result.scheduleMonths.length).toBe(360);
    expect(result.scheduleMonths[359]!.balance).toBeCloseTo(0, 2);
    expect(result.payoffMonthIndex).toBe(360);
  });

  it("rolls PITI into the total monthly payment", () => {
    expect(result.totalMonthlyPayment).toBeCloseTo(
      result.monthlyPI + result.monthlyTax + result.monthlyInsurance + result.monthlyHoa,
      6
    );
  });
});

describe("computeMortgage — PMI applies below 20% down and cancels at 78% LTV", () => {
  const inputs = {
    ...getDefaultMortgageInputs(),
    homePrice: 300000,
    downPaymentPercent: 10,
    interestRatePercent: 6,
    loanTermYears: 30,
    propertyTaxAnnual: 0,
    homeInsuranceAnnual: 0,
    hoaMonthly: 0,
    pmiAnnualPercent: 1,
  };
  const result = computeMortgage(inputs);

  it("charges PMI at the start of the loan", () => {
    expect(result.monthlyPmi).toBeGreaterThan(0);
    expect(result.scheduleMonths[0]!.pmi).toBeGreaterThan(0);
  });

  it("drops PMI once the balance reaches 78% of the original price", () => {
    expect(result.pmiDropoffMonthIndex).not.toBeNull();
    const dropoffIndex = result.pmiDropoffMonthIndex!;
    const monthBefore = result.scheduleMonths[dropoffIndex - 2]!;
    const monthAt = result.scheduleMonths[dropoffIndex - 1]!;
    expect(monthBefore.pmi).toBeGreaterThan(0);
    expect(monthAt.pmi).toBe(0);
    expect(monthAt.balance).toBeLessThanOrEqual(inputs.homePrice * 0.78);
  });
});

describe("compareToBaseline — extra payments shorten the loan and cut interest", () => {
  const base = {
    ...getDefaultMortgageInputs(),
    homePrice: 350000,
    downPaymentPercent: 20,
    interestRatePercent: 6.5,
    loanTermYears: 30,
    propertyTaxAnnual: 0,
    homeInsuranceAnnual: 0,
    hoaMonthly: 0,
    pmiAnnualPercent: 0,
  };

  it("reduces total interest and payoff time with extra monthly payments", () => {
    const withExtra = { ...base, extraMonthlyPayment: 300 };
    const impact = compareToBaseline(withExtra);
    expect(impact.interestSaved).toBeGreaterThan(0);
    expect(impact.monthsSaved).toBeGreaterThan(0);

    const result = computeMortgage(withExtra);
    const baseline = computeMortgage(base);
    expect(result.payoffMonthIndex).toBeLessThan(baseline.payoffMonthIndex);
    expect(result.totalInterestPaid).toBeLessThan(baseline.totalInterestPaid);
  });

  it("applies a one-time lump sum only in the specified month", () => {
    const withLumpSum = { ...base, extraOneTimePayment: 20000, extraOneTimeMonth: 12 };
    const result = computeMortgage(withLumpSum);
    const month12 = result.scheduleMonths.find((m) => m.monthIndex === 12)!;
    const month13 = result.scheduleMonths.find((m) => m.monthIndex === 13)!;
    expect(month12.extraPrincipal).toBeCloseTo(20000, 2);
    expect(month13.extraPrincipal).toBe(0);
  });

  it("never pays more principal than the remaining balance", () => {
    const result = computeMortgage({
      ...base,
      loanTermYears: 5,
      extraMonthlyPayment: 10000,
    });
    for (const month of result.scheduleMonths) {
      expect(month.balance).toBeGreaterThanOrEqual(0);
    }
    expect(result.scheduleMonths[result.scheduleMonths.length - 1]!.balance).toBeCloseTo(0, 2);
  });
});
