/**
 * Lightweight, dependency-free bot defense for the public signup form,
 * which now sits behind a public marketing page instead of a login wall
 * and so is a more reachable spam target than before. Two signals,
 * combined:
 *  - a hidden "honeypot" field real users never see or fill in
 *  - a minimum time between when the form rendered and when it was
 *    submitted, since scripted submissions tend to fire near-instantly
 *
 * Not a captcha replacement for a high-value target, but it filters out
 * the bulk of unsophisticated spam bots without adding a third-party
 * dependency or asking a human to solve a puzzle.
 */
const MIN_FILL_TIME_MS = 1200;
const MAX_FORM_AGE_MS = 1000 * 60 * 60 * 6; // 6 hours — reject stale/replayed timestamps

export function isLikelyBot(input: { honeypot?: unknown; formRenderedAt?: unknown }): boolean {
  if (typeof input.honeypot === "string" && input.honeypot.trim() !== "") return true;

  const renderedAt = typeof input.formRenderedAt === "number" ? input.formRenderedAt : null;
  if (renderedAt === null) return true;

  const elapsed = Date.now() - renderedAt;
  if (elapsed < MIN_FILL_TIME_MS) return true;
  if (elapsed > MAX_FORM_AGE_MS) return true;

  return false;
}
