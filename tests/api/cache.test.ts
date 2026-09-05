import { afterEach, beforeEach, describe, expect, setSystemTime, test } from "bun:test";
import { CACHE_TTL_MS, clearCache, getCached, setCached } from "../../api/_lib/cache";
import type { ContributionData } from "../../api/_lib/types";

function buildData(username: string): ContributionData {
  return { username, totalContributions: 7, weeks: [{ days: [{ date: "2025-08-31", count: 7, level: 4 }] }] };
}

beforeEach(() => {
  clearCache();
});

afterEach(() => {
  setSystemTime();
  clearCache();
});

describe("response cache", () => {
  test("returns undefined for a username never cached", () => {
    expect(getCached("torvalds")).toBeUndefined();
  });

  test("returns the cached value within the TTL window", () => {
    const data = buildData("torvalds");
    setCached("torvalds", data);

    expect(getCached("torvalds")).toEqual(data);
  });

  test("treats an expired entry as a miss", () => {
    const start = new Date("2025-09-05T12:00:00.000Z");
    setSystemTime(start);
    setCached("torvalds", buildData("torvalds"));

    setSystemTime(new Date(start.getTime() + CACHE_TTL_MS));
    expect(getCached("torvalds")).toBeUndefined();
  });

  test("overwrites a previous entry for the same username", () => {
    setCached("torvalds", buildData("torvalds"));
    const replacement = { ...buildData("torvalds"), totalContributions: 99 };
    setCached("torvalds", replacement);

    expect(getCached("torvalds")?.totalContributions).toBe(99);
  });

  test("is case-insensitive on the username key", () => {
    const data = buildData("Torvalds");
    setCached("Torvalds", data);

    expect(getCached("torvalds")).toEqual(data);
    expect(getCached("TORVALDS")).toEqual(data);
  });
});
