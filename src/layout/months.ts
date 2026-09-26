import type { ContributionModel, Day } from "../contributions/types";

export const MONTHS_PER_CITY = 12;

export interface MonthBucket {
  key: string;
  levels: number[];
  days: Day[];
}

function monthKeys(reference: string): string[] {
  const [year, month] = reference.split("-").map(Number);
  const lastIndex = (year ?? 0) * 12 + ((month ?? 1) - 1);

  return Array.from({ length: MONTHS_PER_CITY }, (_, offset) => {
    const index = lastIndex - (MONTHS_PER_CITY - 1 - offset);
    const keyYear = String(Math.floor(index / 12)).padStart(4, "0");
    const keyMonth = String((index % 12) + 1).padStart(2, "0");
    return `${keyYear}-${keyMonth}`;
  });
}

export function groupDaysByMonth(model: ContributionModel, slots: number): MonthBucket[] {
  const days = model.weeks.flatMap((week) => week.days);
  const lastDate = days.at(-1)?.date;
  if (!lastDate) return [];

  const keys = monthKeys(lastDate.slice(0, 7));
  const wanted = new Set(keys);
  const firstDayOf = new Map<string, number>();

  days.forEach((day, index) => {
    const key = day.date.slice(0, 7);
    if (wanted.has(key) && !firstDayOf.has(key)) firstDayOf.set(key, index);
  });

  return keys.map((key) => {
    const start = firstDayOf.get(key);
    const window = start === undefined ? [] : days.slice(start, start + slots);
    return { key, levels: window.map((day) => day.level), days: window };
  });
}
