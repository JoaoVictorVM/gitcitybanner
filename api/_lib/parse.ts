import { load } from "cheerio";
import type { ContributionData, Day, Week } from "./types";

export const WEEKS_PER_YEAR = 53;
export const DAYS_PER_WEEK = 7;

export class ParseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ParseError";
  }
}

const MS_PER_DAY = 86_400_000;

function toUtcTime(isoDate: string): number {
  const [year, month, day] = isoDate.split("-").map(Number);
  if (!year || !month || !day) throw new ParseError(`Unparseable day cell date: ${isoDate}`);
  return Date.UTC(year, month - 1, day);
}

function toIsoDate(time: number): string {
  return new Date(time).toISOString().slice(0, 10);
}

function parseCount(tooltipText: string | undefined): number {
  if (!tooltipText) return 0;
  const match = /^\s*([\d,]+)\s+contribution/i.exec(tooltipText);
  if (!match?.[1]) return 0;
  return Number.parseInt(match[1].replaceAll(",", ""), 10);
}

function parseLevel(raw: string | undefined): number {
  const level = Number.parseInt(raw ?? "", 10);
  if (!Number.isFinite(level) || level < 0 || level > 4) return 0;
  return level;
}

export function parseContributionsSvg(html: string, username: string): ContributionData {
  const $ = load(html);

  const tooltips = new Map<string, string>();
  $("tool-tip[for]").each((_, element) => {
    const target = $(element).attr("for");
    if (target) tooltips.set(target, $(element).text());
  });

  const byDate = new Map<string, Day>();
  $("[data-date][data-level]").each((_, element) => {
    const cell = $(element);
    const date = cell.attr("data-date");
    if (!date) return;
    const id = cell.attr("id");
    byDate.set(date, {
      date,
      count: parseCount(id ? tooltips.get(id) : undefined),
      level: parseLevel(cell.attr("data-level")),
    });
  });

  if (byDate.size === 0) throw new ParseError("No day cells found in the upstream document.");

  const times = [...byDate.keys()].map(toUtcTime).sort((a, b) => a - b);
  const firstTime = times[0]!;
  const lastTime = times[times.length - 1]!;
  const gridStart = firstTime - new Date(firstTime).getUTCDay() * MS_PER_DAY;
  const weekCount = Math.floor((lastTime - gridStart) / MS_PER_DAY / DAYS_PER_WEEK) + 1;

  if (weekCount !== WEEKS_PER_YEAR) {
    throw new ParseError(`Expected ${WEEKS_PER_YEAR} weeks, found ${weekCount}.`);
  }

  const weeks: Week[] = [];
  let totalContributions = 0;
  for (let week = 0; week < WEEKS_PER_YEAR; week += 1) {
    const days: Day[] = [];
    for (let weekday = 0; weekday < DAYS_PER_WEEK; weekday += 1) {
      const date = toIsoDate(gridStart + (week * DAYS_PER_WEEK + weekday) * MS_PER_DAY);
      const day = byDate.get(date) ?? { date, count: 0, level: 0 };
      totalContributions += day.count;
      days.push(day);
    }
    weeks.push({ days });
  }

  return { username, totalContributions, weeks };
}
