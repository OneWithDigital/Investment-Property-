import { monthlyPrincipalAndInterest } from "./calculations";

/**
 * A BRRRR-style cash-out refinance, modeled as a distinct before/after
 * snapshot rather than an event inside the multi-year projection. That's
 * a deliberate simplification: it assumes the refinance happens shortly
 * after rehab completes, before meaningful principal paydown, so the
 * amount being paid off is the original loan amount rather than an
 * amortized balance at some specific month. Good enough to answer "how
 * much of my cash do I get back, and what does the deal look like
 * afterward" — not a substitute for lender-specific seasoning
 * requirements (many require 6-12 months of ownership before a cash-out
 * refi) or a month-by-month cash-flow timeline through the rehab period.
 */
export interface RefiInputs {
  afterRepairValue: number;
  refinanceLtvPercent: number;
  newInterestRatePercent: number;
  newLoanTermYears: number;
  refinanceClosingCostPercent: number;
}

export interface RefiResult {
  newLoanAmount: number;
  refinanceClosingCosts: number;
  /** Positive = cash back in your pocket at the refi table; negative = you had to bring more cash. */
  cashPulledOut: number;
  /** What's still tied up in the deal after the refi; can be $0 or negative (all cash out, some profit too). */
  cashLeftInDeal: number;
  newMonthlyPrincipalAndInterest: number;
  postRefiMonthlyCashFlow: number;
  postRefiAnnualCashFlow: number;
  /** null when cashLeftInDeal <= 0 — cash-on-cash is undefined/infinite with no cash left in the deal. */
  postRefiCashOnCashReturnPercent: number | null;
  postRefiDscr: number;
}

export function calculateRefi(
  originalLoanAmount: number,
  totalCashInvested: number,
  monthlyNoi: number,
  refi: RefiInputs
): RefiResult {
  const newLoanAmount = refi.afterRepairValue * (refi.refinanceLtvPercent / 100);
  const refinanceClosingCosts = newLoanAmount * (refi.refinanceClosingCostPercent / 100);
  const cashPulledOut = newLoanAmount - originalLoanAmount - refinanceClosingCosts;
  const cashLeftInDeal = totalCashInvested - cashPulledOut;

  const newMonthlyPrincipalAndInterest = monthlyPrincipalAndInterest(
    newLoanAmount,
    refi.newInterestRatePercent,
    refi.newLoanTermYears
  );
  const postRefiMonthlyCashFlow = monthlyNoi - newMonthlyPrincipalAndInterest;
  const postRefiAnnualCashFlow = postRefiMonthlyCashFlow * 12;
  const postRefiCashOnCashReturnPercent =
    cashLeftInDeal > 0 ? (postRefiAnnualCashFlow / cashLeftInDeal) * 100 : null;

  const annualDebtService = newMonthlyPrincipalAndInterest * 12;
  const annualNoi = monthlyNoi * 12;
  const postRefiDscr = annualDebtService > 0 ? annualNoi / annualDebtService : Infinity;

  return {
    newLoanAmount,
    refinanceClosingCosts,
    cashPulledOut,
    cashLeftInDeal,
    newMonthlyPrincipalAndInterest,
    postRefiMonthlyCashFlow,
    postRefiAnnualCashFlow,
    postRefiCashOnCashReturnPercent,
    postRefiDscr,
  };
}

export const DEFAULT_REFI_INPUTS: Omit<RefiInputs, "afterRepairValue"> = {
  refinanceLtvPercent: 75,
  newInterestRatePercent: 7,
  newLoanTermYears: 30,
  refinanceClosingCostPercent: 3,
};
