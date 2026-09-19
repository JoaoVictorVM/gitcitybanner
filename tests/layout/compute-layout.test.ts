import { describe, expect, test } from "bun:test";

import {
  GRID_SLOTS,
  cellSizeOf,
  computeCityLayout,
  computeWindows,
  gridBlockHeightOf,
} from "../../src/layout/compute-layout";
import { LAYOUT_CONSTANTS, resolveLayoutConstants } from "../../src/layout/constants";
import type { CanvasDimensions, ContributionModel } from "../../src/layout/types";
import { buildModel } from "../contributions/fixture";

const X_CANVAS: CanvasDimensions = { width: 1500, height: 500 };
const LINKEDIN_CANVAS: CanvasDimensions = { width: 1584, height: 396 };

const X_CONSTANTS = LAYOUT_CONSTANTS["1500x500"]!;
const X_GRID_BLOCK = gridBlockHeightOf(X_CONSTANTS);

function modelWithMonthCounts(countForMonth: (key: string) => number): ContributionModel {
  const base = buildModel();
  const weeks = base.weeks.map((week) => ({
    days: week.days.map((day) => ({
      ...day,
      count: countForMonth(day.date.slice(0, 7)),
      level: 2,
    })),
  }));
  return { ...base, weeks };
}

function modelWithDayLevels(levelFor: (date: string) => number): ContributionModel {
  const base = buildModel();
  const weeks = base.weeks.map((week) => ({
    days: week.days.map((day) => ({ ...day, count: 1, level: levelFor(day.date) })),
  }));
  return { ...base, weeks };
}

function ascendingMonths(): ContributionModel {
  return modelWithMonthCounts((key) => Number(key.slice(5, 7)));
}

describe("computeCityLayout", () => {
  test("returns twelve buildings in chronological order", () => {
    const layout = computeCityLayout(ascendingMonths(), X_CANVAS);
    const xs = layout.buildings.map((building) => building.x);

    expect(layout.buildings).toHaveLength(12);
    expect(xs).toEqual([...xs].sort((a, b) => a - b));
  });

  test("the row of buildings is centered on the canvas", () => {
    const layout = computeCityLayout(ascendingMonths(), X_CANVAS);
    const first = layout.buildings[0]!;
    const last = layout.buildings[11]!;

    expect(first.x).toBe(31);
    expect(1500 - (last.x + last.width)).toBe(first.x);
  });

  test("every window in the city shares the same size", () => {
    const layout = computeCityLayout(ascendingMonths(), X_CANVAS);
    const sizes = new Set(
      layout.buildings.flatMap((building) =>
        building.windows.map((window) => `${window.width}x${window.height}`),
      ),
    );

    expect(sizes).toEqual(new Set(["13x13"]));
  });

  test("every building is the same height whatever the month totals are", () => {
    const layout = computeCityLayout(
      modelWithMonthCounts((key) => (key === "2025-07" ? 5 : key === "2025-02" ? 0 : 1)),
      X_CANVAS,
    );
    const heights = new Set(layout.buildings.map((building) => building.height));

    expect(heights).toEqual(new Set([X_GRID_BLOCK + X_CONSTANTS.base]));
  });

  test("an all zero model keeps the same height and dark windows", () => {
    const layout = computeCityLayout(buildModel(), X_CANVAS);

    for (const building of layout.buildings) {
      expect(building.height).toBe(X_GRID_BLOCK + X_CONSTANTS.base);
      expect(Number.isFinite(building.x)).toBe(true);
      for (const window of building.windows) {
        expect(Number.isFinite(window.x)).toBe(true);
        expect(Number.isFinite(window.y)).toBe(true);
        expect(window.level).toBe(0);
      }
    }
  });

  test("every building holds a full grid of windows", () => {
    const layout = computeCityLayout(buildModel(), X_CANVAS);
    const counts = layout.buildings.map((building) => building.windows.length);

    expect(GRID_SLOTS).toBe(35);
    expect(counts).toEqual(Array.from({ length: 12 }, () => GRID_SLOTS));
  });

  test("a short month carries on into the first days of the next one", () => {
    const layout = computeCityLayout(
      modelWithDayLevels((date) => (date.startsWith("2025-03") ? 4 : 1)),
      X_CANVAS,
    );
    const february = layout.buildings[1]!;

    expect(february.windows.slice(0, 28).every((window) => window.level === 1)).toBe(true);
    expect(february.windows.slice(28).map((window) => window.level)).toEqual([4, 4, 4, 4, 4, 4, 4]);
  });

  test("the last building goes dark where the calendar runs out", () => {
    const layout = computeCityLayout(
      modelWithDayLevels(() => 3),
      X_CANVAS,
    );
    const december = layout.buildings[11]!;

    expect(december.windows.slice(0, 27).every((window) => window.level === 3)).toBe(true);
    expect(december.windows.slice(27).every((window) => window.level === 0)).toBe(true);
  });

  test("days run down a column before moving to the next one", () => {
    const layout = computeCityLayout(buildModel(), X_CANVAS);
    const march = layout.buildings[2]!;
    const cellSize = cellSizeOf(X_CONSTANTS);

    const first = march.windows[0]!;
    const seventh = march.windows[6]!;
    const eighth = march.windows[7]!;

    expect(first.x).toBe(seventh.x);
    expect(seventh.y - first.y).toBe(6 * cellSize);
    expect(eighth.y).toBe(first.y);
    expect(eighth.x - first.x).toBe(cellSize);
  });

  test("windows sit inside their building", () => {
    const layout = computeCityLayout(ascendingMonths(), X_CANVAS);

    for (const building of layout.buildings) {
      const top = layout.groundY - building.height;
      for (const window of building.windows) {
        expect(window.x).toBeGreaterThanOrEqual(building.x);
        expect(window.x + window.width).toBeLessThanOrEqual(building.x + building.width);
        expect(window.y).toBeGreaterThanOrEqual(top);
        expect(window.y + window.height).toBeLessThanOrEqual(layout.groundY);
      }
    }
  });

  test("the roof overhangs both walls and peaks above the body", () => {
    const layout = computeCityLayout(ascendingMonths(), X_CANVAS);
    const building = layout.buildings[0]!;
    const top = layout.groundY - building.height;

    expect(building.roof.left).toEqual({ x: building.x - X_CONSTANTS.roofOverhang, y: top });
    expect(building.roof.right).toEqual({
      x: building.x + building.width + X_CONSTANTS.roofOverhang,
      y: top,
    });
    expect(building.roof.apex).toEqual({
      x: building.x + building.width / 2,
      y: top - X_CONSTANTS.roofHeight,
    });
  });

  test("neighbouring roofs never overlap", () => {
    const layout = computeCityLayout(ascendingMonths(), X_CANVAS);

    for (let index = 1; index < layout.buildings.length; index += 1) {
      expect(layout.buildings[index]!.roof.left.x).toBeGreaterThan(
        layout.buildings[index - 1]!.roof.right.x,
      );
    }
  });

  test("the chimney rises from the right slope without passing the apex", () => {
    const layout = computeCityLayout(ascendingMonths(), X_CANVAS);
    const building = layout.buildings[0]!;
    const top = layout.groundY - building.height;

    expect(building.chimney).toEqual({
      x: building.x + building.width - X_CONSTANTS.chimneyInset - X_CONSTANTS.chimneyWidth,
      y: top - X_CONSTANTS.chimneyHeight,
      width: X_CONSTANTS.chimneyWidth,
      height: X_CONSTANTS.chimneyHeight,
    });
    expect(building.chimney.x).toBeGreaterThan(building.roof.apex.x);
    expect(building.chimney.y).toBeGreaterThan(building.roof.apex.y);
  });

  test("every roof fits above the canvas top edge", () => {
    for (const canvas of [X_CANVAS, LINKEDIN_CANVAS]) {
      const layout = computeCityLayout(ascendingMonths(), canvas);
      for (const building of layout.buildings) {
        expect(building.roof.apex.y).toBeGreaterThan(0);
        expect(layout.groundY).toBeLessThan(canvas.height);
      }
    }
  });

  test("pure function is deterministic", () => {
    const model = ascendingMonths();
    expect(computeCityLayout(model, X_CANVAS)).toEqual(computeCityLayout(model, X_CANVAS));
  });

  test("1500x500 and 1584x396 are computed independently", () => {
    const model = ascendingMonths();
    const x = computeCityLayout(model, X_CANVAS);
    const linkedin = computeCityLayout(model, LINKEDIN_CANVAS);

    expect(resolveLayoutConstants(X_CANVAS)).toEqual(X_CONSTANTS);
    expect(resolveLayoutConstants(LINKEDIN_CANVAS)).toEqual(LAYOUT_CONSTANTS["1584x396"]!);

    expect(x.groundY).toBe(448);
    expect(linkedin.groundY).toBe(350);
    expect(linkedin.buildings[0]?.x).toBe(49);

    expect(linkedin.buildings[0]!.height).not.toBe(x.buildings[0]!.height);
    expect(linkedin.buildings[0]!.width).not.toBe(x.buildings[0]!.width);
  });

  test("unrecognized canvas size throws", () => {
    expect(() => computeCityLayout(buildModel(), { width: 800, height: 600 })).toThrow(
      /Unsupported canvas size 800x600/,
    );
  });
});

describe("computeWindows", () => {
  test("fills the grid column by column from the building top-left", () => {
    const windows = computeWindows([1, 0, 0, 0, 0, 0, 0, 4], 100, 200, X_CONSTANTS);

    expect(windows).toHaveLength(GRID_SLOTS);
    expect(windows[0]).toEqual({ x: 109.5, y: 213.5, width: 13, height: 13, level: 1 });
    expect(windows[7]).toEqual({ x: 125.5, y: 213.5, width: 13, height: 13, level: 4 });
  });

  test("pads a month with no days into a fully dark grid", () => {
    const windows = computeWindows([], 100, 200, X_CONSTANTS);

    expect(windows).toHaveLength(GRID_SLOTS);
    expect(windows.every((window) => window.level === 0)).toBe(true);
  });
});
