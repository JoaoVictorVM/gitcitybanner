import { afterEach, beforeEach, describe, expect, setSystemTime, test } from "bun:test";
import {
  RATE_LIMIT_MAX_ENTRIES,
  RATE_LIMIT_PER_IP,
  RATE_LIMIT_UNKNOWN,
  RATE_LIMIT_WINDOW_MS,
  checkAndRecord,
  rateLimitEntryCount,
  resetRateLimit,
} from "../../api/_lib/rateLimit";

function seedDistinctIps(total: number): void {
  for (let index = 0; index < total; index += 1) {
    checkAndRecord(`10.0.${Math.floor(index / 256)}.${index % 256}`);
  }
}

beforeEach(() => {
  resetRateLimit();
});

afterEach(() => {
  setSystemTime();
  resetRateLimit();
});

describe("checkAndRecord", () => {
  test("allows the first 20 requests from one IP within the window", () => {
    for (let index = 0; index < RATE_LIMIT_PER_IP; index += 1) {
      expect(checkAndRecord("203.0.113.5").allowed).toBe(true);
    }
  });

  test("rejects the 21st request from the same IP within the window", () => {
    for (let index = 0; index < RATE_LIMIT_PER_IP; index += 1) checkAndRecord("203.0.113.5");
    const verdict = checkAndRecord("203.0.113.5");

    expect(verdict.allowed).toBe(false);
    expect(verdict.retryAfterSeconds).toBeGreaterThan(0);
    expect(Number.isInteger(verdict.retryAfterSeconds)).toBe(true);
  });

  test("resets the counter once the window elapses", () => {
    const start = new Date("2025-09-05T12:00:00.000Z");
    setSystemTime(start);
    for (let index = 0; index < RATE_LIMIT_PER_IP; index += 1) checkAndRecord("203.0.113.5");
    expect(checkAndRecord("203.0.113.5").allowed).toBe(false);

    setSystemTime(new Date(start.getTime() + RATE_LIMIT_WINDOW_MS));
    expect(checkAndRecord("203.0.113.5").allowed).toBe(true);
  });

  test("tracks two different IPs independently", () => {
    for (let index = 0; index < RATE_LIMIT_PER_IP; index += 1) checkAndRecord("203.0.113.5");
    expect(checkAndRecord("203.0.113.5").allowed).toBe(false);
    expect(checkAndRecord("198.51.100.7").allowed).toBe(true);
  });

  test("buckets a null IP under the shared unknown key with a 100/hour cap", () => {
    for (let index = 0; index < RATE_LIMIT_UNKNOWN; index += 1) {
      expect(checkAndRecord(null).allowed).toBe(true);
    }

    expect(rateLimitEntryCount()).toBe(1);
    expect(checkAndRecord(null).allowed).toBe(false);
  });

  test("evicts expired entries before recording once the map reaches the cap", () => {
    const start = new Date("2025-09-05T12:00:00.000Z");
    setSystemTime(start);
    seedDistinctIps(RATE_LIMIT_MAX_ENTRIES);
    expect(rateLimitEntryCount()).toBe(RATE_LIMIT_MAX_ENTRIES);

    setSystemTime(new Date(start.getTime() + RATE_LIMIT_WINDOW_MS));
    expect(checkAndRecord("203.0.113.5").allowed).toBe(true);
    expect(rateLimitEntryCount()).toBeLessThan(RATE_LIMIT_MAX_ENTRIES);
  });

  test("hard-resets the map when eviction is insufficient", () => {
    seedDistinctIps(RATE_LIMIT_MAX_ENTRIES);
    expect(rateLimitEntryCount()).toBe(RATE_LIMIT_MAX_ENTRIES);

    expect(checkAndRecord("203.0.113.5").allowed).toBe(true);
    expect(rateLimitEntryCount()).toBe(1);
  });
});
