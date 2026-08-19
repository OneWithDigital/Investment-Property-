import { describe, expect, it } from "vitest";
import { calculateRefi } from "../lib/refi";

describe("calculateRefi — successful BRRRR (cash pulled out, deal self-funds)", () => {
  // Bought for $150k with an 80%-LTV loan ($120k), rehab brings it to
  // $190k all-in cash invested. After-repair value $260k, refi at 75% LTV.
  const result = calculateRefi(120000, 46000, 1400, {
    afterRepairValue: 260000,
    refinanceLtvPercent: 75,
    newInterestRatePercent: 7,
    newLoanTermYears: 30,
    refinanceClosingCostPercent: 3,
  });

  it("computes the new loan as ARV x refi LTV%", () => {
    expect(result.newLoanAmount).toBeCloseTo(195000, 6);
  });

  it("computes refinance closing costs as % of the new loan", () => {
    expect(result.refinanceClosingCosts).toBeCloseTo(5850, 6); // 3% of 195,000
  });

  it("pulls out cash equal to new loan minus old loan minus refi closing costs", () => {
    // 195,000 - 120,000 - 5,850 = 69,150
    expect(result.cashPulledOut).toBeCloseTo(69150, 6);
  });

  it("leaves negative cash in the deal when more is pulled out than was invested", () => {
    // 46,000 invested - 69,150 pulled out = -23,150 (money ahead, not just break-even)
    expect(result.cashLeftInDeal).toBeCloseTo(-23150, 6);
  });

  it("reports cash-on-cash as null (undefined/infinite) when no cash is left in the deal", () => {
    expect(result.postRefiCashOnCashReturnPercent).toBeNull();
  });
});

describe("calculateRefi — partial cash-out, some cash still in the deal", () => {
  const result = calculateRefi(120000, 46000, 1400, {
    afterRepairValue: 200000,
    refinanceLtvPercent: 70,
    newInterestRatePercent: 7,
    newLoanTermYears: 30,
    refinanceClosingCostPercent: 3,
  });

  it("computes a smaller cash-out and leaves cash in the deal", () => {
    // new loan = 140,000; refi closing = 4,200; pulled out = 140,000 - 120,000 - 4,200 = 15,800
    expect(result.newLoanAmount).toBeCloseTo(140000, 6);
    expect(result.cashPulledOut).toBeCloseTo(15800, 6);
    // cash left = 46,000 - 15,800 = 30,200
    expect(result.cashLeftInDeal).toBeCloseTo(30200, 6);
  });

  it("computes a finite cash-on-cash return using the reduced cash-left-in-deal basis", () => {
    expect(result.postRefiCashOnCashReturnPercent).not.toBeNull();
    expect(result.postRefiCashOnCashReturnPercent).toBeCloseTo(
      (result.postRefiAnnualCashFlow / 30200) * 100,
      6
    );
  });
});

describe("calculateRefi — DSCR uses the new post-refi debt service, not the original loan", () => {
  it("computes DSCR = annual NOI / new annual debt service", () => {
    const monthlyNoi = 1800;
    const result = calculateRefi(120000, 46000, monthlyNoi, {
      afterRepairValue: 240000,
      refinanceLtvPercent: 75,
      newInterestRatePercent: 6.5,
      newLoanTermYears: 30,
      refinanceClosingCostPercent: 2,
    });
    const expectedDscr = (monthlyNoi * 12) / (result.newMonthlyPrincipalAndInterest * 12);
    expect(result.postRefiDscr).toBeCloseTo(expectedDscr, 6);
  });

  it("is Infinity when the refi LTV is 0 (no new loan, no debt service)", () => {
    const result = calculateRefi(120000, 46000, 1500, {
      afterRepairValue: 240000,
      refinanceLtvPercent: 0,
      newInterestRatePercent: 6.5,
      newLoanTermYears: 30,
      refinanceClosingCostPercent: 2,
    });
    expect(result.newLoanAmount).toBe(0);
    expect(result.postRefiDscr).toBe(Infinity);
  });
});
