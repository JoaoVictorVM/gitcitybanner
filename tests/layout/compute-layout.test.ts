import { describe, expect, test } from "bun:test";

import { computeCityLayout, computeWindows } from "../../src/layout/compute-layout";
import { LAYOUT_CONSTANTS, resolveLayoutConstants } from "../../src/layout/constants";
import type { CanvasDimensions, ContributionModel } from "../../src/layout/types";
import { buildModel } from "../contributions/fixture";

const X_CANVAS: CanvasDimensions = { width: 1500, height: 500 };
const LINKEDIN_CANVAS: CanvasDimensions = { width: 1584, height: 396 };

function modelWithWeekTotals(totals: number[]): ContributionModel {
  const base = buildModel();
  const weeks = base.weeks.map((week, weekIndex) => ({
    days: week.days.map((day, dayIndex) => ({
      ...day,
      count: dayIndex === 0 ? (totals[weekIndex] ?? 0) : 0,
      level: dayIndex === 0 && (totals[weekIndex] ?? 0) > 0 ? 3 : 0,
    })),
  }));
  return { ...base, weeks, totalContributions: totals.reduce((sum, total) => sum + total, 0) };
}

function ascendingTotals(): number[] {
  return Array.from({ length: 53 }, (_, weekIndex) => weekIndex + 1);
}

describe("computeCityLayout", () => {
  test("returns 53 buildings each with 7 windows", () => {
    const layout = computeCityLayout(modelWithWeekTotals(ascendingTotals()), X_CANVAS);
    expect(layout.buildings).toHaveLength(53);
    for (const building of layout.buildings) {
      expect(building.windows).toHaveLength(7);
    }
  });

  test("building order matches chronological week order", () => {
    const totals = ascendingTotals();
    totals[0] = 1;
    totals[52] = 500;
    const layout = computeCityLayout(modelWithWeekTotals(totals), X_CANVAS);
    const xs = layout.buildings.map((building) => building.x);

    expect(xs).toEqual([...xs].sort((a, b) => a - b));
    expect(layout.buildings[0]?.x).toBe(60);
    expect(layout.buildings[52]?.height).toBe(LAYOUT_CONSTANTS["1500x500"]!.maxHeight);
    expect(layout.buildings[0]?.height).toBeLessThan(layout.buildings[52]!.height);
  });

  test("busiest week building is exactly maxHeight", () => {
    const totals = new Array(53).fill(2);
    totals[7] = 40;
    const layout = computeCityLayout(modelWithWeekTotals(totals), X_CANVAS);
    expect(layout.buildings[7]?.height).toBe(380);
    for (const [index, building] of layout.buildings.entries()) {
      if (index !== 7) expect(building.height).toBeLessThan(380);
    }
  });

  test("zero count week building is exactly minHeight", () => {
    const totals = new Array(53).fill(5);
    totals[12] = 0;
    const layout = computeCityLayout(modelWithWeekTotals(totals), X_CANVAS);
    expect(layout.buildings[12]?.height).toBe(40);
  });

  test("all zero model bypasses division and returns minHeight", () => {
    const layout = computeCityLayout(buildModel(), X_CANVAS);
    for (const building of layout.buildings) {
      expect(building.height).toBe(40);
      expect(Number.isFinite(building.x)).toBe(true);
      for (const window of building.windows) {
        expect(Number.isFinite(window.x)).toBe(true);
        expect(Number.isFinite(window.y)).toBe(true);
        expect(Number.isFinite(window.height)).toBe(true);
        expect(window.level).toBe(0);
      }
    }
  });

  test("pure function is deterministic", () => {
    const model = modelWithWeekTotals(ascendingTotals());
    expect(computeCityLayout(model, X_CANVAS)).toEqual(computeCityLayout(model, X_CANVAS));
  });

  test("1500x500 and 1584x396 are computed independently", () => {
    const model = modelWithWeekTotals(ascendingTotals());
    const x = computeCityLayout(model, X_CANVAS);
    const linkedin = computeCityLayout(model, LINKEDIN_CANVAS);

    expect(resolveLayoutConstants(X_CANVAS)).toEqual({
      padding: 60,
      gap: 6,
      buildingWidth: 20,
      minHeight: 40,
      maxHeight: 380,
      groundLine: 40,
    });
    expect(resolveLayoutConstants(LINKEDIN_CANVAS)).toEqual({
      padding: 64,
      gap: 6,
      buildingWidth: 21,
      minHeight: 32,
      maxHeight: 290,
      groundLine: 34,
    });

    expect(x.groundY).toBe(460);
    expect(linkedin.groundY).toBe(362);

    const heightRatios = x.buildings.map(
      (building, index) => linkedin.buildings[index]!.height / building.height,
    );
    const widthRatio = linkedin.buildings[0]!.width / x.buildings[0]!.width;
    const uniqueHeightRatios = new Set(heightRatios.map((ratio) => ratio.toFixed(6)));

    expect(uniqueHeightRatios.size).toBeGreaterThan(1);
    expect(widthRatio).not.toBe(1584 / 1500);
  });

  test("top window band is sunday and bottom is saturday", () => {
    const model = buildModel();
    const weeks = model.weeks.map((week, weekIndex) => ({
      days: week.days.map((day, dayIndex) => ({
        ...day,
        count: weekIndex === 3 ? dayIndex : 1,
        level: weekIndex === 3 ? dayIndex % 5 : 1,
      })),
    }));
    const layout = computeCityLayout({ ...model, weeks }, X_CANVAS);
    const building = layout.buildings[3]!;

    expect(building.windows.map((window) => window.level)).toEqual([0, 1, 2, 3, 4, 0, 1]);
    expect(building.windows[0]!.y).toBeLessThan(building.windows[6]!.y);
    expect(building.windows[0]!.level).toBe(weeks[3]!.days[0]!.level);
    expect(building.windows[6]!.level).toBe(weeks[3]!.days[6]!.level);
  });

  test("window dimensions are capped", () => {
    const totals = new Array(53).fill(0);
    totals[9] = 40;
    const layout = computeCityLayout(modelWithWeekTotals(totals), X_CANVAS);
    const building = layout.buildings[9]!;

    expect(building.height).toBe(380);
    for (const window of building.windows) {
      expect(window.width).toBe(10);
      expect(window.height).toBe(14);
      expect(window.x).toBe(building.x + 5);
    }
  });

  test("minimum height buildings still hold one window per band at both sizes", () => {
    for (const canvas of [X_CANVAS, LINKEDIN_CANVAS]) {
      const layout = computeCityLayout(buildModel(), canvas);
      const building = layout.buildings[0]!;
      expect(building.windows).toHaveLength(7);
      expect(building.windows[0]!.height).toBe(building.height / 7 / 2);
    }
  });

  test("unrecognized canvas size throws", () => {
    expect(() => computeCityLayout(buildModel(), { width: 800, height: 600 })).toThrow(
      /Unsupported canvas size 800x600/,
    );
  });
});

describe("computeWindows", () => {
  test("skips windows when the band is shorter than 4px", () => {
    const days = buildModel().weeks[0]!.days;
    expect(computeWindows(days, 100, 20, 300, 27)).toEqual([]);
    expect(computeWindows(days, 100, 20, 300, 28)).toHaveLength(7);
  });

  test("centers each window inside its band", () => {
    const days = buildModel().weeks[0]!.days;
    const windows = computeWindows(days, 100, 20, 200, 70);

    expect(windows[0]).toEqual({ x: 105, y: 202.5, width: 10, height: 5, level: 0 });
    expect(windows[6]).toEqual({ x: 105, y: 262.5, width: 10, height: 5, level: 0 });
  });
});
