import { describe, expect, test } from "bun:test";

import type { ContributionModel } from "../../src/contributions/types";
import { groupDaysByMonth } from "../../src/layout/months";
import { buildModel } from "../contributions/fixture";

const SLOTS = 35;

function modelWithLevels(levelFor: (date: string) => number): ContributionModel {
  const base = buildModel();
  const weeks = base.weeks.map((week) => ({
    days: week.days.map((day) => ({
      ...day,
      count: levelFor(day.date),
      level: levelFor(day.date),
    })),
  }));
  return { ...base, weeks };
}

describe("groupDaysByMonth", () => {
  test("returns the last twelve months in chronological order", () => {
    const buckets = groupDaysByMonth(buildModel(), SLOTS);

    expect(buckets).toHaveLength(12);
    expect(buckets.map((bucket) => bucket.key)).toEqual([
      "2025-01",
      "2025-02",
      "2025-03",
      "2025-04",
      "2025-05",
      "2025-06",
      "2025-07",
      "2025-08",
      "2025-09",
      "2025-10",
      "2025-11",
      "2025-12",
    ]);
  });

  test("fills every slot by carrying on into the following month", () => {
    const buckets = groupDaysByMonth(buildModel(), SLOTS);

    expect(buckets.slice(0, 11).map((bucket) => bucket.levels.length)).toEqual(
      Array.from({ length: 11 }, () => SLOTS),
    );
  });

  test("the last month stops where the calendar stops", () => {
    const december = groupDaysByMonth(buildModel(), SLOTS)[11]!;

    expect(december.levels).toHaveLength(27);
  });

  test("a bucket starts on the first day of its own month", () => {
    const buckets = groupDaysByMonth(
      modelWithLevels((date) => (date === "2025-01-01" || date === "2025-01-31" ? 4 : 0)),
      SLOTS,
    );
    const january = buckets[0]!;

    expect(january.levels[0]).toBe(4);
    expect(january.levels[30]).toBe(4);
    expect(january.levels.filter((level) => level === 4)).toHaveLength(2);
  });

  test("a short month borrows the first days of the next one", () => {
    const february = groupDaysByMonth(
      modelWithLevels((date) => (date.startsWith("2025-03") ? 3 : 1)),
      SLOTS,
    )[1]!;

    expect(february.levels.slice(0, 28).every((level) => level === 1)).toBe(true);
    expect(february.levels.slice(28)).toEqual([3, 3, 3, 3, 3, 3, 3]);
  });

  test("a borrowed day keeps lighting its own month too", () => {
    const buckets = groupDaysByMonth(
      modelWithLevels((date) => (date === "2025-03-01" ? 3 : 0)),
      SLOTS,
    );

    expect(buckets[1]?.levels[28]).toBe(3);
    expect(buckets[2]?.levels[0]).toBe(3);
  });

  test("days outside the twelve months never reach a bucket", () => {
    const buckets = groupDaysByMonth(
      modelWithLevels((date) => (date.startsWith("2024-12") ? 4 : 0)),
      SLOTS,
    );

    for (const bucket of buckets) expect(bucket.levels.every((level) => level === 0)).toBe(true);
  });

  test("asking for fewer slots truncates the month", () => {
    const january = groupDaysByMonth(buildModel(), 7)[0]!;

    expect(january.levels).toHaveLength(7);
  });

  test("is pure and deterministic", () => {
    const model = modelWithLevels((date) => date.length % 5);
    expect(groupDaysByMonth(model, SLOTS)).toEqual(groupDaysByMonth(model, SLOTS));
  });
});
