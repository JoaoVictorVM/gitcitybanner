import { describe, expect, test } from "bun:test";
import { ParseError, parseContributionsSvg } from "../../api/_lib/parse";
import { buildCalendarHtml } from "./fixture";

describe("parseContributionsSvg", () => {
  test("extracts exactly 53 weeks of 7 days", () => {
    const data = parseContributionsSvg(buildCalendarHtml(), "torvalds");
    expect(data.username).toBe("torvalds");
    expect(data.weeks).toHaveLength(53);
    for (const week of data.weeks) {
      expect(week.days).toHaveLength(7);
    }
  });

  test("orders weeks oldest first and days Sunday through Saturday", () => {
    const data = parseContributionsSvg(buildCalendarHtml({ startDate: "2025-08-31" }), "torvalds");
    const first = data.weeks[0]!;
    expect(first.days[0]!.date).toBe("2025-08-31");
    expect(new Date(`${first.days[0]!.date}T00:00:00Z`).getUTCDay()).toBe(0);
    expect(first.days[6]!.date).toBe("2025-09-06");
    expect(new Date(`${first.days[6]!.date}T00:00:00Z`).getUTCDay()).toBe(6);
    expect(data.weeks[1]!.days[0]!.date).toBe("2025-09-07");
  });

  test("sums the total contributions across every day", () => {
    const html = buildCalendarHtml({ countFor: (index) => (index % 10 === 0 ? 4 : 0) });
    const data = parseContributionsSvg(html, "torvalds");
    const sum = data.weeks.flatMap((week) => week.days).reduce((total, day) => total + day.count, 0);
    expect(data.totalContributions).toBe(sum);
    expect(data.totalContributions).toBeGreaterThan(0);
  });

  test("every day carries an ISO date, a numeric count and a level between 0 and 4", () => {
    const data = parseContributionsSvg(buildCalendarHtml({ countFor: (index) => index % 13 }), "torvalds");
    for (const day of data.weeks.flatMap((week) => week.days)) {
      expect(day.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(Number.isInteger(day.count)).toBe(true);
      expect(day.level).toBeGreaterThanOrEqual(0);
      expect(day.level).toBeLessThanOrEqual(4);
    }
  });

  test("pads the trailing partial week to 7 days", () => {
    const data = parseContributionsSvg(buildCalendarHtml({ daysInLastWeek: 5 }), "torvalds");
    expect(data.weeks).toHaveLength(53);
    const last = data.weeks[52]!;
    expect(last.days).toHaveLength(7);
    expect(last.days[6]!.count).toBe(0);
    expect(last.days[6]!.level).toBe(0);
  });

  test("throws ParseError when the week count is not 53", () => {
    expect(() => parseContributionsSvg(buildCalendarHtml({ weeks: 40 }), "torvalds")).toThrow(ParseError);
    expect(() => parseContributionsSvg(buildCalendarHtml({ weeks: 60 }), "torvalds")).toThrow(ParseError);
  });

  test("throws ParseError when the document has no day cells", () => {
    expect(() => parseContributionsSvg("<html><body><p>nope</p></body></html>", "torvalds")).toThrow(ParseError);
  });
});
