const MS_PER_DAY = 86_400_000;

export interface CalendarFixtureOptions {
  startDate?: string;
  weeks?: number;
  daysInLastWeek?: number;
  countFor?: (dayIndex: number) => number;
}

function isoDate(startTime: number, offsetDays: number): string {
  return new Date(startTime + offsetDays * MS_PER_DAY).toISOString().slice(0, 10);
}

function levelFor(count: number): number {
  if (count === 0) return 0;
  if (count < 3) return 1;
  if (count < 6) return 2;
  if (count < 10) return 3;
  return 4;
}

export function buildCalendarHtml(options: CalendarFixtureOptions = {}): string {
  const { startDate = "2025-08-31", weeks = 53, daysInLastWeek = 7, countFor = () => 0 } = options;
  const startTime = Date.parse(`${startDate}T00:00:00Z`);

  const cells: string[] = [];
  const tooltips: string[] = [];
  let dayIndex = 0;
  for (let week = 0; week < weeks; week += 1) {
    const days = week === weeks - 1 ? daysInLastWeek : 7;
    for (let weekday = 0; weekday < days; weekday += 1) {
      const date = isoDate(startTime, week * 7 + weekday);
      const count = countFor(dayIndex);
      const id = `contribution-day-component-${weekday}-${week}`;
      cells.push(
        `<td data-date="${date}" id="${id}" data-level="${levelFor(count)}" class="ContributionCalendar-day"></td>`,
      );
      tooltips.push(
        `<tool-tip for="${id}" class="sr-only">${count === 0 ? "No" : count} contribution${count === 1 ? "" : "s"} on ${date}.</tool-tip>`,
      );
      dayIndex += 1;
    }
  }

  return `<div class="js-yearly-contributions"><table>${cells.join("")}</table>${tooltips.join("")}</div>`;
}
