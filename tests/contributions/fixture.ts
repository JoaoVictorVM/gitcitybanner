import type { ContributionModel, Week } from "../../src/contributions/types";

export const FIXTURE_FIRST_DATE = "2024-12-22";
export const FIXTURE_LAST_DATE = "2025-12-27";

function isoDate(dayOffset: number): string {
  const start = Date.UTC(2024, 11, 22);
  return new Date(start + dayOffset * 86_400_000).toISOString().slice(0, 10);
}

export function buildModel(overrides: Partial<ContributionModel> = {}): ContributionModel {
  const weeks: Week[] = Array.from({ length: 53 }, (_, weekIndex) => ({
    days: Array.from({ length: 7 }, (_, dayIndex) => ({
      date: isoDate(weekIndex * 7 + dayIndex),
      count: 0,
      level: 0,
    })),
  }));
  return { username: "torvalds", totalContributions: 0, weeks, ...overrides };
}
