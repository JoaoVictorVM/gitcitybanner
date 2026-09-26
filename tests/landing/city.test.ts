import { describe, expect, test } from "bun:test";

import type { ContributionModel } from "../../src/contributions/types";
import {
  CITY_DIMENSIONS,
  dimModel,
  drawCity,
  progressState,
  sampleModel,
  windowAt,
} from "../../src/landing/city";
import { computeCityLayout } from "../../src/layout/compute-layout";
import { buildModel } from "../contributions/fixture";
import { registerDom } from "../dom";

registerDom();

const { createRecordingCanvas } = await import("../render/context");

function countedModel(): ContributionModel {
  const base = buildModel();
  const weeks = base.weeks.map((week) => ({
    days: week.days.map((day) => ({ ...day, count: 2, level: 3 })),
  }));
  return { ...base, weeks, totalContributions: 2 * 371 };
}

function litCount(model: ContributionModel): number {
  return model.weeks.flatMap((week) => week.days).filter((day) => day.level > 0).length;
}

describe("sampleModel", () => {
  test("is a full contribution model that needs no network", () => {
    expect(sampleModel.username).toBe("torvalds");
    expect(sampleModel.weeks).toHaveLength(53);
    for (const week of sampleModel.weeks) expect(week.days).toHaveLength(7);
  });
});

describe("dimModel", () => {
  test("keeps the first days lit in calendar order and darkens the rest", () => {
    const half = dimModel(countedModel(), 0.5);
    const days = half.weeks.flatMap((week) => week.days);

    expect(litCount(half)).toBe(Math.floor(371 * 0.5));
    expect(days[0]!.level).toBe(3);
    expect(days.at(-1)!.level).toBe(0);
  });

  test("clamps fractions outside zero and one", () => {
    expect(litCount(dimModel(countedModel(), -3))).toBe(0);
    expect(litCount(dimModel(countedModel(), 7))).toBe(371);
  });

  test("never mutates the source model", () => {
    const model = countedModel();
    dimModel(model, 0.2);
    expect(litCount(model)).toBe(371);
  });
});

describe("progressState", () => {
  test("counts the days and contributions revealed so far", () => {
    const state = progressState(countedModel(), 0.5);

    expect(state.litDays).toBe(185);
    expect(state.contributions).toBe(370);
    expect(state.date).toBe(countedModel().weeks.flatMap((week) => week.days)[184]!.date);
  });

  test("starts on the first day with nothing counted", () => {
    const model = countedModel();
    const state = progressState(model, 0);

    expect(state.litDays).toBe(0);
    expect(state.contributions).toBe(0);
    expect(state.date).toBe(model.weeks[0]!.days[0]!.date);
  });

  test("ends on the last day with the full total", () => {
    const model = countedModel();
    const state = progressState(model, 1);

    expect(state.litDays).toBe(371);
    expect(state.contributions).toBe(742);
    expect(state.date).toBe(model.weeks.at(-1)!.days.at(-1)!.date);
  });
});

describe("windowAt", () => {
  test("returns the day behind the window under the point", () => {
    const model = countedModel();
    const first = computeCityLayout(model, CITY_DIMENSIONS).buildings[0]!.windows[0]!;

    const hit = windowAt(model, CITY_DIMENSIONS, first.x + 1, first.y + 1);

    expect(hit).toEqual({
      date: "2025-01-01",
      count: 2,
      x: first.x,
      y: first.y,
      width: first.width,
      height: first.height,
    });
  });

  test("follows the column-by-column order inside a house", () => {
    const model = countedModel();
    const eighth = computeCityLayout(model, CITY_DIMENSIONS).buildings[0]!.windows[7]!;

    expect(windowAt(model, CITY_DIMENSIONS, eighth.x + 1, eighth.y + 1)?.date).toBe("2025-01-08");
  });

  test("returns null between windows and on the sky", () => {
    const model = countedModel();
    const first = computeCityLayout(model, CITY_DIMENSIONS).buildings[0]!.windows[0]!;

    expect(windowAt(model, CITY_DIMENSIONS, first.x + first.width + 1, first.y + 1)).toBeNull();
    expect(windowAt(model, CITY_DIMENSIONS, 5, 5)).toBeNull();
  });

  test("returns null on a padding slot past the end of the calendar", () => {
    const model = countedModel();
    const lastHouse = computeCityLayout(model, CITY_DIMENSIONS).buildings[11]!;
    const padding = lastHouse.windows[34]!;

    expect(windowAt(model, CITY_DIMENSIONS, padding.x + 1, padding.y + 1)).toBeNull();
  });
});

describe("drawCity", () => {
  test("renders the dimmed city at the canvas resolution", () => {
    const { canvas, calls } = createRecordingCanvas();
    drawCity(canvas, countedModel(), 1, "pt-BR");

    expect(canvas.width).toBe(CITY_DIMENSIONS.width);
    expect(canvas.height).toBe(CITY_DIMENSIONS.height);
    expect(calls.filter((call) => call.method === "fillRect")).toHaveLength(2 + 12 + 12 + 420);
  });

  test("uses the requested locale for the caption", () => {
    const { canvas, calls } = createRecordingCanvas();
    drawCity(canvas, countedModel(), 1, "en");

    const texts = calls.filter((call) => call.method === "fillText");
    expect(String(texts[0]?.args[0])).toContain("contributions");
  });
});
