export const RATE_LIMIT_WINDOW_MS = 3_600_000;
export const RATE_LIMIT_PER_IP = 20;
export const RATE_LIMIT_UNKNOWN = 100;
export const RATE_LIMIT_MAX_ENTRIES = 10_000;

const UNKNOWN_KEY = "unknown";

interface CounterEntry {
  count: number;
  windowStart: number;
  limit: number;
}

export interface RateLimitVerdict {
  allowed: boolean;
  retryAfterSeconds: number;
}

const counters = new Map<string, CounterEntry>();

function hashIp(ip: string): string {
  let hash = 0x811c9dc5;
  for (let index = 0; index < ip.length; index += 1) {
    hash ^= ip.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return hash.toString(16);
}

function evictIfNeeded(now: number): void {
  if (counters.size < RATE_LIMIT_MAX_ENTRIES) return;

  for (const [key, entry] of counters) {
    if (now - entry.windowStart >= RATE_LIMIT_WINDOW_MS) counters.delete(key);
  }

  if (counters.size >= RATE_LIMIT_MAX_ENTRIES) counters.clear();
}

export function checkAndRecord(ip: string | null): RateLimitVerdict {
  const now = Date.now();
  const key = ip === null ? UNKNOWN_KEY : hashIp(ip);
  const limit = ip === null ? RATE_LIMIT_UNKNOWN : RATE_LIMIT_PER_IP;

  let entry = counters.get(key);
  if (entry && now - entry.windowStart >= RATE_LIMIT_WINDOW_MS) {
    counters.delete(key);
    entry = undefined;
  }

  if (!entry) {
    evictIfNeeded(now);
    counters.set(key, { count: 1, windowStart: now, limit });
    return { allowed: true, retryAfterSeconds: 0 };
  }

  if (entry.count >= entry.limit) {
    const remaining = entry.windowStart + RATE_LIMIT_WINDOW_MS - now;
    return { allowed: false, retryAfterSeconds: Math.max(1, Math.ceil(remaining / 1000)) };
  }

  entry.count += 1;
  return { allowed: true, retryAfterSeconds: 0 };
}

export function resetRateLimit(): void {
  counters.clear();
}

export function rateLimitEntryCount(): number {
  return counters.size;
}
