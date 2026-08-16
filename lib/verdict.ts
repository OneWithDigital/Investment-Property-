import type { CalculationResult, Verdict, VerdictLabel } from "./types";
import { computeVerdict, type WeightedCriterion } from "./verdict/scoreCriteria";

/**
 * Benchmarks drawn from widely-cited buy-and-hold rental investing
 * heuristics (BiggerPockets 1%/50% rules, conventional lender DSCR
 * minimums, and typical cash-on-cash / cap-rate targets used by
 * long-term rental investors). These are general-purpose guardrails,
 * not a substitute for local market comps.
 */
const BENCHMARKS = {
  cashOnCashGood: 8,
  cashOnCashStrong: 12,
  capRateGood: 6,
  capRateStrong: 8,
  dscrMin: 1.25,
  dscrStrong: 1.5,
  onePercentRuleTarget: 1.0,
  breakEvenRatioMax: 85,
};

const SUMMARIES: Record<VerdictLabel, string> = {
  "Strong Buy":
    "This property clears the standard buy-and-hold benchmarks (cash flow, cash-on-cash, cap rate, DSCR). Confirm the rent and expense assumptions against real comps, then move forward with due diligence.",
  "Good Investment":
    "Solid on most fronts but not exceptional everywhere. Worth pursuing, especially if you can improve terms (lower price, better rate, or higher rent) or if it fits a specific strategy like appreciation or house-hacking.",
  "Marginal — Negotiate":
    "The deal is cash-flow positive but thin on cushion. Try to negotiate price/terms, verify rent and expense estimates carefully, and stress-test for vacancy or rate increases before committing.",
  Pass: "Cash flow is positive but the deal underperforms most standard benchmarks. Only proceed if you have a specific thesis (forced appreciation, rezoning, strong local growth) that the numbers alone don't capture.",
};

export function evaluateVerdict(result: CalculationResult): Verdict {
  const positiveCashFlow = result.monthlyCashFlow > 0;

  const criteria: WeightedCriterion[] = [
    {
      label: "Positive monthly cash flow",
      pass: positiveCashFlow,
      detail: `Monthly cash flow is $${result.monthlyCashFlow.toFixed(0)}.`,
      weight: 30,
    },
    {
      label: `Cash-on-cash return ≥ ${BENCHMARKS.cashOnCashGood}%`,
      pass: result.cashOnCashReturnPercent >= BENCHMARKS.cashOnCashGood,
      detail: `Cash-on-cash return is ${result.cashOnCashReturnPercent.toFixed(1)}%.`,
      weight: 20,
    },
    {
      label: `Cap rate ≥ ${BENCHMARKS.capRateGood}%`,
      pass: result.capRatePercent >= BENCHMARKS.capRateGood,
      detail: `Cap rate is ${result.capRatePercent.toFixed(1)}%.`,
      weight: 15,
    },
    {
      label: `DSCR ≥ ${BENCHMARKS.dscrMin.toFixed(2)} (lender comfort zone)`,
      pass: result.dscr >= BENCHMARKS.dscrMin,
      detail: `DSCR is ${Number.isFinite(result.dscr) ? result.dscr.toFixed(2) : "∞ (no debt)"}.`,
      weight: 15,
    },
    {
      label: "Meets the 1% rule (rent ≥ 1% of price)",
      pass: result.onePercentRulePercent >= BENCHMARKS.onePercentRuleTarget,
      detail: `Rent is ${result.onePercentRulePercent.toFixed(2)}% of purchase price.`,
      weight: 10,
    },
    {
      label: `Break-even ratio ≤ ${BENCHMARKS.breakEvenRatioMax}%`,
      pass: result.breakEvenRatioPercent <= BENCHMARKS.breakEvenRatioMax,
      detail: `Break-even ratio is ${result.breakEvenRatioPercent.toFixed(0)}% (expenses + debt service as a share of income — lower means more cushion against vacancy).`,
      weight: 10,
    },
  ];

  let bonus = 0;
  if (result.cashOnCashReturnPercent >= BENCHMARKS.cashOnCashStrong) bonus += 5;
  if (result.capRatePercent >= BENCHMARKS.capRateStrong) bonus += 5;
  if (result.dscr >= BENCHMARKS.dscrStrong) bonus += 5;

  return computeVerdict(criteria, bonus, SUMMARIES, {
    triggered: !positiveCashFlow,
    summary:
      "This deal loses money every month at the numbers entered. Renegotiate the price, increase the down payment, or find a way to raise rent/lower expenses before proceeding.",
  });
}
