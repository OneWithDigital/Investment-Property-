import { describe, expect, it } from "vitest";
import {
  simulateBalanceTransferPlan,
  type BalanceTransferInputs,
} from "../lib/calc/balanceTransfer";

const baseCard = {
  creditLimit: 20000,
  transferFeePercent: 3,
  promoAprPercent: 0,
  promoMonths: 12,
  postPromoAprPercent: 24,
  annualFee: 0,
};

describe("simulateBalanceTransferPlan — single card, fully paid off inside the promo", () => {
  const inputs: BalanceTransferInputs = {
    startingBalance: 5000,
    monthlyPayment: 500,
    startDate: "2026-01-01",
    reminderLeadDays: 30,
    cards: [{ id: "a", name: "Card A", ...baseCard }],
  };
  const result = simulateBalanceTransferPlan(inputs);

  it("pays the balance off with 0% interest", () => {
    expect(result.fullyPaidOff).toBe(true);
    expect(result.totalInterestPaid).toBeCloseTo(0, 6);
    expect(result.remainingBalance).toBeCloseTo(0, 6);
  });

  it("charges the 3% transfer fee once on the starting balance", () => {
    expect(result.totalTransferFees).toBeCloseTo(150, 2);
  });

  it("generates no rotation reminders when nothing needs to move to a second card", () => {
    expect(result.reminders).toHaveLength(0);
  });
});

describe("simulateBalanceTransferPlan — rotates across two cards", () => {
  const inputs: BalanceTransferInputs = {
    startingBalance: 10000,
    monthlyPayment: 400,
    startDate: "2026-01-01",
    reminderLeadDays: 45,
    cards: [
      { id: "a", name: "Card A", ...baseCard, promoMonths: 12 },
      { id: "b", name: "Card B", ...baseCard, promoMonths: 18, transferFeePercent: 4 },
    ],
  };
  const result = simulateBalanceTransferPlan(inputs);

  it("moves the leftover balance to the second card after the first promo ends", () => {
    expect(result.stages).toHaveLength(2);
    expect(result.stages[0]?.paidOffDuringPromo).toBe(false);
    expect(result.stages[1]?.transferDate).toBe(result.stages[0]?.promoEndDate);
  });

  it("charges a transfer fee on each hop, including the second card's balance", () => {
    const secondIncoming = result.stages[1]?.incomingBalance ?? 0;
    expect(result.stages[1]?.transferFee).toBeCloseTo(secondIncoming * 0.04, 2);
  });

  it("produces a reminder before the first card's promo expires", () => {
    expect(result.reminders.length).toBeGreaterThanOrEqual(1);
    expect(result.reminders[0]?.date < result.stages[0]!.promoEndDate).toBe(true);
  });
});

describe("simulateBalanceTransferPlan — caps a transfer at the card's credit limit", () => {
  const inputs: BalanceTransferInputs = {
    startingBalance: 10000,
    monthlyPayment: 300,
    startDate: "2026-01-01",
    reminderLeadDays: 30,
    cards: [{ id: "a", name: "Tight Limit", ...baseCard, creditLimit: 5000 }],
  };
  const result = simulateBalanceTransferPlan(inputs);

  it("flags the shortfall instead of silently transferring more than the limit", () => {
    expect(result.stages[0]?.exceededCreditLimit).toBe(true);
    expect(result.stages[0]?.uncoveredAmount).toBeGreaterThan(0);
    expect(result.warnings.some((w) => w.includes("credit limit"))).toBe(true);
  });
});

describe("simulateBalanceTransferPlan — running out of cards leaves a warning, not a crash", () => {
  const inputs: BalanceTransferInputs = {
    startingBalance: 20000,
    monthlyPayment: 1000,
    startDate: "2026-01-01",
    reminderLeadDays: 30,
    cards: [{ id: "a", name: "Only Card", ...baseCard, promoMonths: 6 }],
  };
  const result = simulateBalanceTransferPlan(inputs);

  it("keeps amortizing at the post-promo APR on the last card", () => {
    expect(result.stages[0]?.postPromoMonths).toBeGreaterThan(0);
    expect(result.totalInterestPaid).toBeGreaterThan(0);
  });
});

describe("simulateBalanceTransferPlan — hostile/malformed input is sanitized, not fatal", () => {
  const inputs = {
    startingBalance: Number.NaN,
    monthlyPayment: -500,
    startDate: "not-a-date",
    reminderLeadDays: -10,
    cards: [
      {
        id: "a",
        name: "x".repeat(500),
        creditLimit: -1,
        transferFeePercent: 9999,
        promoAprPercent: -50,
        promoMonths: 99999999,
        postPromoAprPercent: Number.POSITIVE_INFINITY,
        annualFee: Number.NaN,
      },
    ],
  } as unknown as BalanceTransferInputs;

  it("does not throw and returns a well-formed, finite result", () => {
    expect(() => simulateBalanceTransferPlan(inputs)).not.toThrow();
    const result = simulateBalanceTransferPlan(inputs);
    expect(Number.isFinite(result.totalCostOfPlan)).toBe(true);
    expect(Number.isFinite(result.totalMonths)).toBe(true);
  });
});
