/**
 * Best-effort brute-force throttle for the serverless auth functions.
 *
 * Counters live in the instance's memory, so on a serverless host the limit is
 * enforced per warm instance rather than globally. That still blunts a single
 * attacker hammering one connection, but for a real deployment move this to a
 * shared store (Upstash Redis, Vercel KV) — see DEPLOYMENT.md.
 */

interface Bucket {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, Bucket>();

export interface RateLimitResult {
  allowed: boolean;
  retryAfterSeconds: number;
}

export function hit(key: string, limit: number, windowMs: number): RateLimitResult {
  const now = Date.now();
  const existing = buckets.get(key);

  if (!existing || existing.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, retryAfterSeconds: 0 };
  }

  existing.count += 1;

  if (existing.count > limit) {
    return { allowed: false, retryAfterSeconds: Math.ceil((existing.resetAt - now) / 1000) };
  }

  return { allowed: true, retryAfterSeconds: 0 };
}

export function reset(key: string): void {
  buckets.delete(key);
}

/** Drops expired buckets so a long-lived instance cannot grow unbounded. */
export function sweep(): void {
  const now = Date.now();
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) buckets.delete(key);
  }
}
