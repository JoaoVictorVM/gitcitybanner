import type { ContributionModel, Day } from "../contributions/types";
import type { Locale } from "../i18n/translations";
import { GRID_SLOTS, computeCityLayout } from "../layout/compute-layout";
import { groupDaysByMonth } from "../layout/months";
import type { CanvasDimensions } from "../layout/types";
import { renderBanner } from "../render/renderer";
import sample from "./sample.json";

export const CITY_DIMENSIONS: CanvasDimensions = { width: 1500, height: 500 };

export const sampleModel: ContributionModel = sample;

export interface ProgressState {
  litDays: number;
  contributions: number;
  date: string;
}

export interface WindowHit {
  date: string;
  count: number;
  x: number;
  y: number;
  width: number;
  height: number;
}

function clamp(fraction: number): number {
  if (fraction < 0) return 0;
  if (fraction > 1) return 1;
  return fraction;
}

function allDays(model: ContributionModel): Day[] {
  return model.weeks.flatMap((week) => week.days);
}

function litDaysAt(total: number, fraction: number): number {
  return Math.floor(clamp(fraction) * total);
}

export function dimModel(model: ContributionModel, fraction: number): ContributionModel {
  const totalDays = model.weeks.reduce((sum, week) => sum + week.days.length, 0);
  const litDays = litDaysAt(totalDays, fraction);
  let index = 0;

  return {
    ...model,
    weeks: model.weeks.map((week) => ({
      days: week.days.map((day) => {
        const lit = index < litDays;
        index += 1;
        return lit ? day : { ...day, level: 0 };
      }),
    })),
  };
}

export function progressState(model: ContributionModel, fraction: number): ProgressState {
  const days = allDays(model);
  const litDays = litDaysAt(days.length, fraction);
  const contributions = days.slice(0, litDays).reduce((sum, day) => sum + day.count, 0);
  const current = days[Math.max(0, litDays - 1)];

  return { litDays, contributions, date: current?.date ?? "" };
}

export function windowAt(
  model: ContributionModel,
  dimensions: CanvasDimensions,
  x: number,
  y: number,
): WindowHit | null {
  const buildings = computeCityLayout(model, dimensions).buildings;
  const months = groupDaysByMonth(model, GRID_SLOTS);

  for (const [index, building] of buildings.entries()) {
    const slot = building.windows.findIndex(
      (window) =>
        x >= window.x && x < window.x + window.width && y >= window.y && y < window.y + window.height,
    );
    if (slot < 0) continue;

    const day = months[index]?.days[slot];
    const window = building.windows[slot]!;
    if (!day) return null;
    return { date: day.date, count: day.count, x: window.x, y: window.y, width: window.width, height: window.height };
  }

  return null;
}

export function drawCity(
  canvas: HTMLCanvasElement,
  model: ContributionModel,
  fraction: number,
  locale: Locale,
): void {
  renderBanner(canvas, dimModel(model, fraction), CITY_DIMENSIONS, locale);
}
