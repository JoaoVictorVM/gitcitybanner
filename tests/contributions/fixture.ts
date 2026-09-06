import type { ContributionModel, Week } from "../../src/contributions/types";

export function buildModel(overrides: Partial<ContributionModel> = {}): ContributionModel {
  const weeks: Week[] = Array.from({ length: 53 }, (_, weekIndex) => ({
    days: Array.from({ length: 7 }, (_, dayIndex) => ({
      date: `2025-01-${String((weekIndex + dayIndex) % 28 + 1).padStart(2, "0")}`,
      count: 0,
      level: 0,
    })),
  }));
  return { username: "torvalds", totalContributions: 0, weeks, ...overrides };
}
