import { afterEach, describe, expect, test } from "bun:test";

import type { ContributionModel } from "../../src/contributions/types";
import type { CanvasDimensions } from "../../src/layout/types";
import { formatCaptionText, formatFooterText } from "../../src/render/captions";
import { resolveRenderConstants } from "../../src/render/constants";
import { resolvePalette } from "../../src/render/palette";
import { renderBanner } from "../../src/render/renderer";
import { buildModel } from "../contributions/fixture";
import { registerDom } from "../dom";

registerDom();

const { createRecordingCanvas } = await import("./context");
type DrawCall = Awaited<ReturnType<typeof createRecordingCanvas>>["calls"][number];

const X_CANVAS: CanvasDimensions = { width: 1500, height: 500 };
const LINKEDIN_CANVAS: CanvasDimensions = { width: 1584, height: 396 };

function busyModel(): ContributionModel {
  const base = buildModel();
  const weeks = base.weeks.map((week, weekIndex) => ({
    days: week.days.map((day, dayIndex) => ({
      ...day,
      count: (weekIndex + dayIndex) * 3,
      level: (weekIndex + dayIndex) % 5,
    })),
  }));
  return { ...base, weeks, totalContributions: 12345 };
}

function fillRects(calls: DrawCall[]): DrawCall[] {
  return calls.filter((call) => call.method === "fillRect");
}

function texts(calls: DrawCall[]): DrawCall[] {
  return calls.filter((call) => call.method === "fillText");
}

afterEach(() => {
  delete (globalThis as { devicePixelRatio?: number }).devicePixelRatio;
});

describe("renderBanner", () => {
  test("sets the canvas to the requested dimensions", () => {
    const { canvas } = createRecordingCanvas();
    canvas.width = 10;
    canvas.height = 10;

    renderBanner(canvas, busyModel(), X_CANVAS, "pt-BR");
    expect(canvas.width).toBe(1500);
    expect(canvas.height).toBe(500);

    renderBanner(canvas, busyModel(), LINKEDIN_CANVAS, "en");
    expect(canvas.width).toBe(1584);
    expect(canvas.height).toBe(396);
  });

  test("returns the same canvas it was given", () => {
    const { canvas } = createRecordingCanvas();
    expect(renderBanner(canvas, busyModel(), X_CANVAS, "pt-BR")).toBe(canvas);
  });

  test("draws sky, ground, buildings, windows, then captions in that order", () => {
    const { canvas, calls } = createRecordingCanvas();
    renderBanner(canvas, busyModel(), X_CANVAS, "pt-BR");

    const rects = fillRects(calls);
    expect(rects[0]?.args).toEqual([0, 0, 1500, 500]);
    expect(rects[1]?.args[1]).toBe(460);

    const buildingRects = rects.slice(2, 55);
    const windowRects = rects.slice(55);
    const palette = resolvePalette();
    expect(buildingRects.every((call) => call.fillStyle === palette.building)).toBe(true);
    expect(windowRects.every((call) => palette.windows.includes(call.fillStyle))).toBe(true);

    const lastRectIndex = calls.lastIndexOf(rects[rects.length - 1]!);
    const firstTextIndex = calls.indexOf(texts(calls)[0]!);
    expect(firstTextIndex).toBeGreaterThan(lastRectIndex);
    expect(texts(calls)).toHaveLength(2);
  });

  test("draws exactly 53 building and 371 window rectangles", () => {
    const { canvas, calls } = createRecordingCanvas();
    renderBanner(canvas, busyModel(), X_CANVAS, "pt-BR");

    const rects = fillRects(calls);
    expect(rects).toHaveLength(2 + 53 + 371);
  });

  test("draws level-zero windows instead of skipping them", () => {
    const { canvas, calls } = createRecordingCanvas();
    const model = busyModel();
    model.weeks[0] = { days: model.weeks[0]!.days.map((day) => ({ ...day, count: 0, level: 0 })) };

    renderBanner(canvas, model, X_CANVAS, "pt-BR");

    const palette = resolvePalette();
    const windowRects = fillRects(calls).slice(55);
    expect(windowRects.filter((call) => call.fillStyle === palette.windows[0]).length).toBeGreaterThanOrEqual(7);
    expect(windowRects).toHaveLength(371);
  });

  test("fills each window with the palette entry for its level", () => {
    const { canvas, calls } = createRecordingCanvas();
    const model = busyModel();
    renderBanner(canvas, model, X_CANVAS, "pt-BR");

    const palette = resolvePalette();
    const expectedLevels = model.weeks.flatMap((week) => week.days.map((day) => day.level));
    const windowRects = fillRects(calls).slice(55);
    expect(windowRects.map((call) => call.fillStyle)).toEqual(
      expectedLevels.map((level) => palette.windows[level]!),
    );
  });

  test("draws the caption top-left and the footer bottom-right", () => {
    const { canvas, calls } = createRecordingCanvas();
    const model = busyModel();
    renderBanner(canvas, model, X_CANVAS, "pt-BR");

    const constants = resolveRenderConstants(X_CANVAS);
    const [caption, footer] = texts(calls);

    expect(caption?.args).toEqual([formatCaptionText(model.username, 12345, "pt-BR"), 40, 44]);
    expect(caption?.textAlign).toBe("left");
    expect(caption?.font).toContain(`${constants.captionFontSize}px`);

    expect(footer?.args).toEqual([formatFooterText(), 1460, 464]);
    expect(footer?.textAlign).toBe("right");
    expect(footer?.font).toContain(`${constants.footerFontSize}px`);
  });

  test("uses the english caption on the english locale", () => {
    const { canvas, calls } = createRecordingCanvas();
    renderBanner(canvas, busyModel(), X_CANVAS, "en");
    expect(texts(calls)[0]?.args[0]).toBe("@torvalds · 12,345 contributions");
  });

  test("makes no draw calls beyond the fixed order", () => {
    const { canvas, calls } = createRecordingCanvas();
    renderBanner(canvas, busyModel(), X_CANVAS, "pt-BR");

    for (const method of ["strokeRect", "drawImage", "arc"]) {
      expect(calls.some((call) => call.method === method)).toBe(false);
    }
  });

  test("produces identical draw calls across two renders", () => {
    const first = createRecordingCanvas();
    const second = createRecordingCanvas();
    const model = busyModel();

    renderBanner(first.canvas, model, X_CANVAS, "pt-BR");
    renderBanner(second.canvas, model, X_CANVAS, "pt-BR");

    expect(first.calls).toEqual(second.calls);
  });

  test("renders a full 1500x500 banner in under 100ms", () => {
    const { canvas } = createRecordingCanvas();
    const model = busyModel();

    const start = performance.now();
    renderBanner(canvas, model, X_CANVAS, "pt-BR");
    expect(performance.now() - start).toBeLessThan(100);
  });

  test("ignores devicePixelRatio", () => {
    (globalThis as { devicePixelRatio?: number }).devicePixelRatio = 3;
    const { canvas } = createRecordingCanvas();

    renderBanner(canvas, busyModel(), X_CANVAS, "pt-BR");
    expect(canvas.width).toBe(1500);
    expect(canvas.height).toBe(500);
  });

  test("throws when the 2D context is unavailable", () => {
    const canvas = document.createElement("canvas");
    expect(() => renderBanner(canvas, busyModel(), X_CANVAS, "pt-BR")).toThrow();
  });
});
