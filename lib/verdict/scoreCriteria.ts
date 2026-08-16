import type { Verdict, VerdictCriterion, VerdictLabel } from "@/lib/types";

export interface WeightedCriterion {
  label: string;
  pass: boolean;
  detail: string;
  weight: number;
}

export interface GateCondition {
  triggered: boolean;
  summary: string;
}

/**
 * Shared weighted-criteria scoring used by every property-type
 * calculator. Each calculator supplies its own benchmarks/weights (they
 * differ meaningfully by asset class — see each lib/calc/*.ts module) but
 * they all funnel through the same scoring -> label mapping so the
 * verdict UI behaves consistently across tabs.
 *
 * `gate` is an optional hard-fail condition that overrides the score
 * entirely (e.g. an STR ban, or negative cash flow) — some risks aren't
 * "a few points off," they're disqualifying.
 */
export function computeVerdict(
  criteria: WeightedCriterion[],
  bonusPoints: number,
  summaries: Record<VerdictLabel, string>,
  gate?: GateCondition
): Verdict {
  const displayCriteria: VerdictCriterion[] = criteria.map((c) => ({
    label: c.label,
    pass: c.pass,
    detail: c.detail,
  }));

  if (gate?.triggered) {
    return {
      label: "Pass",
      score: 0,
      criteria: displayCriteria,
      summary: gate.summary,
    };
  }

  let score = 0;
  for (const c of criteria) {
    if (c.pass) score += c.weight;
  }
  score = Math.min(score + bonusPoints, 100);

  let label: VerdictLabel;
  if (score >= 75) label = "Strong Buy";
  else if (score >= 50) label = "Good Investment";
  else if (score >= 30) label = "Marginal — Negotiate";
  else label = "Pass";

  return { label, score, criteria: displayCriteria, summary: summaries[label] };
}
