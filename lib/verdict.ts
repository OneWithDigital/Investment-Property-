import type { CalculationResult, Verdict, VerdictCriterion } from "./types";

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

export function evaluateVerdict(result: CalculationResult): Verdict {
  const criteria: VerdictCriterion[] = [];

  const positiveCashFlow = result.monthlyCashFlow > 0;
  criteria.push({
    label: "Positive monthly cash flow",
    pass: positiveCashFlow,
    detail: `Monthly cash flow is $${result.monthlyCashFlow.toFixed(0)}.`,
  });

  const cocPass = result.cashOnCashReturnPercent >= BENCHMARKS.cashOnCashGood;
  criteria.push({
    label: `Cash-on-cash return ≥ ${BENCHMARKS.cashOnCashGood}%`,
    pass: cocPass,
    detail: `Cash-on-cash return is ${result.cashOnCashReturnPercent.toFixed(1)}%.`,
  });

  const capRatePass = result.capRatePercent >= BENCHMARKS.capRateGood;
  criteria.push({
    label: `Cap rate ≥ ${BENCHMARKS.capRateGood}%`,
    pass: capRatePass,
    detail: `Cap rate is ${result.capRatePercent.toFixed(1)}%.`,
  });

  const dscrPass = result.dscr >= BENCHMARKS.dscrMin;
  criteria.push({
    label: `DSCR ≥ ${BENCHMARKS.dscrMin.toFixed(2)} (lender comfort zone)`,
    pass: dscrPass,
    detail: `DSCR is ${Number.isFinite(result.dscr) ? result.dscr.toFixed(2) : "∞ (no debt)"}.`,
  });

  const onePercentPass =
    result.onePercentRulePercent >= BENCHMARKS.onePercentRuleTarget;
  criteria.push({
    label: "Meets the 1% rule (rent ≥ 1% of price)",
    pass: onePercentPass,
    detail: `Rent is ${result.onePercentRulePercent.toFixed(2)}% of purchase price.`,
  });

  const breakEvenPass =
    result.breakEvenRatioPercent <= BENCHMARKS.breakEvenRatioMax;
  criteria.push({
    label: `Break-even ratio ≤ ${BENCHMARKS.breakEvenRatioMax}%`,
    pass: breakEvenPass,
    detail: `Break-even ratio is ${result.breakEvenRatioPercent.toFixed(0)}% (expenses + debt service as a share of income — lower means more cushion against vacancy).`,
  });

  const weights: Record<string, number> = {
    "Positive monthly cash flow": 30,
    [`Cash-on-cash return ≥ ${BENCHMARKS.cashOnCashGood}%`]: 20,
    [`Cap rate ≥ ${BENCHMARKS.capRateGood}%`]: 15,
    [`DSCR ≥ ${BENCHMARKS.dscrMin.toFixed(2)} (lender comfort zone)`]: 15,
    "Meets the 1% rule (rent ≥ 1% of price)": 10,
    [`Break-even ratio ≤ ${BENCHMARKS.breakEvenRatioMax}%`]: 10,
  };

  let score = 0;
  for (const c of criteria) {
    if (c.pass) score += weights[c.label] ?? 0;
  }

  // Bonus points for exceeding "strong" thresholds, capped at 100.
  if (result.cashOnCashReturnPercent >= BENCHMARKS.cashOnCashStrong) score += 5;
  if (result.capRatePercent >= BENCHMARKS.capRateStrong) score += 5;
  if (result.dscr >= BENCHMARKS.dscrStrong) score += 5;
  score = Math.min(score, 100);

  let label: Verdict["label"];
  let summary: string;

  if (!positiveCashFlow) {
    label = "Pass";
    summary =
      "This deal loses money every month at the numbers entered. Renegotiate the price, increase the down payment, or find a way to raise rent/lower expenses before proceeding.";
  } else if (score >= 75) {
    label = "Strong Buy";
    summary =
      "This property clears the standard buy-and-hold benchmarks (cash flow, cash-on-cash, cap rate, DSCR). Confirm the rent and expense assumptions against real comps, then move forward with due diligence.";
  } else if (score >= 50) {
    label = "Good Investment";
    summary =
      "Solid on most fronts but not exceptional everywhere. Worth pursuing, especially if you can improve terms (lower price, better rate, or higher rent) or if it fits a specific strategy like appreciation or house-hacking.";
  } else if (score >= 30) {
    label = "Marginal — Negotiate";
    summary =
      "The deal is cash-flow positive but thin on cushion. Try to negotiate price/terms, verify rent and expense estimates carefully, and stress-test for vacancy or rate increases before committing.";
  } else {
    label = "Pass";
    summary =
      "Cash flow is positive but the deal underperforms most standard benchmarks. Only proceed if you have a specific thesis (forced appreciation, rezoning, strong local growth) that the numbers alone don't capture.";
  }

  return { label, score, criteria, summary };
}
