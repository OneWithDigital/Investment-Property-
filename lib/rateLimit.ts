/**
 * Basic in-memory, single-process rate limiter for auth endpoints
 * (signup, login, password reset, resend-verification). This is a
 * pragmatic default, not a complete solution: state lives in this
 * server process's memory, so it resets on restart and does NOT share
 * state across multiple instances (e.g. serverless functions, or a
 * horizontally-scaled deployment). For a multi-instance production
 * deployment, replace this with a shared store (Redis, Upstash, or a
 * Postgres-backed counter) behind the same `rateLimit()` interface.
 */
interface Bucket {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, Bucket>();
let callsSinceSweep = 0;

function sweepExpired(now: number) {
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt < now) buckets.delete(key);
  }
}

export interface RateLimitResult {
  allowed: boolean;
  retryAfterSeconds: number;
}

export function rateLimit(key: string, limit: number, windowMs: number): RateLimitResult {
  const now = Date.now();

  callsSinceSweep += 1;
  if (callsSinceSweep >= 500) {
    callsSinceSweep = 0;
    sweepExpired(now);
  }

  const bucket = buckets.get(key);
  if (!bucket || bucket.resetAt < now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, retryAfterSeconds: 0 };
  }

  if (bucket.count >= limit) {
    return { allowed: false, retryAfterSeconds: Math.ceil((bucket.resetAt - now) / 1000) };
  }

  bucket.count += 1;
  return { allowed: true, retryAfterSeconds: 0 };
}

export function getClientIp(request: Request): string {
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) return forwardedFor.split(",")[0]?.trim() || "unknown";
  const realIp = request.headers.get("x-real-ip");
  if (realIp) return realIp;
  return "unknown";
}
