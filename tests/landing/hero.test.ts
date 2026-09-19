import { describe, expect, test } from "bun:test";

import type { ContributionModel } from "../../src/contributions/types";
import {
  HERO_DIMENSIONS,
  REVEAL_DURATION_MS,
  dimModel,
  mountLandingHero,
  sampleModel,
} from "../../src/landing/hero";
import { buildModel } from "../contributions/fixture";
import { registerDom } from "../dom";

registerDom();

const { createRecordingCanvas } = await import("../render/context");

function litModel(): ContributionModel {
  const base = buildModel();
  const weeks = base.weeks.map((week) => ({
    days: week.days.map((day) => ({ ...day, count: 3, level: 3 })),
  }));
  return { ...base, weeks };
}

function litCount(model: ContributionModel): number {
  return model.weeks.flatMap((week) => week.days).filter((day) => day.level > 0).length;
}

function fakeClock(start = 1000) {
  let now = start;
  const frames: FrameRequestCallback[] = [];
  return {
    now: () => now,
    schedule: (callback: FrameRequestCallback) => {
      frames.push(callback);
      return frames.length;
    },
    advance(ms: number) {
      now += ms;
      const pending = frames.splice(0);
      for (const frame of pending) frame(now);
    },
    pending: () => frames.length,
  };
}

describe("sampleModel", () => {
  test("is a full contribution model that needs no network", () => {
    expect(sampleModel.username).toBe("torvalds");
    expect(sampleModel.weeks).toHaveLength(53);
    expect(sampleModel.totalContributions).toBeGreaterThan(0);
    for (const week of sampleModel.weeks) expect(week.days).toHaveLength(7);
  });
});

describe("dimModel", () => {
  test("keeps the first days lit in calendar order and darkens the rest", () => {
    const model = litModel();
    const half = dimModel(model, 0.5);
    const days = half.weeks.flatMap((week) => week.days);

    expect(litCount(half)).toBe(Math.floor(371 * 0.5));
    expect(days[0]!.level).toBe(3);
    expect(days.at(-1)!.level).toBe(0);
    expect(days.findIndex((day) => day.level === 0)).toBe(litCount(half));
  });

  test("zero darkens every day and one lights every day", () => {
    const model = litModel();
    expect(litCount(dimModel(model, 0))).toBe(0);
    expect(litCount(dimModel(model, 1))).toBe(371);
  });

  test("clamps fractions outside zero and one", () => {
    const model = litModel();
    expect(litCount(dimModel(model, -3))).toBe(0);
    expect(litCount(dimModel(model, 7))).toBe(371);
  });

  test("never mutates the source model and keeps counts intact", () => {
    const model = litModel();
    const dimmed = dimModel(model, 0.2);

    expect(litCount(model)).toBe(371);
    expect(dimmed.weeks.flatMap((week) => week.days).every((day) => day.count === 3)).toBe(true);
    expect(dimmed.username).toBe(model.username);
  });
});

describe("mountLandingHero", () => {
  test("sizes the canvas to the hero dimensions", () => {
    const { canvas } = createRecordingCanvas();
    const clock = fakeClock();
    mountLandingHero(canvas, { now: clock.now, schedule: clock.schedule, reducedMotion: false });

    expect(canvas.width).toBe(HERO_DIMENSIONS.width);
    expect(canvas.height).toBe(HERO_DIMENSIONS.height);
  });

  test("reveals the city over time, lighting more windows on each frame", () => {
    const { canvas, calls } = createRecordingCanvas();
    const clock = fakeClock();
    const palette = { dark: "" };
    mountLandingHero(canvas, { now: clock.now, schedule: clock.schedule, reducedMotion: false });

    const windowsPerRender = 12 * 35;
    const litWindowsOfRender = (index: number) => {
      const rects = calls.filter((call) => call.method === "fillRect");
      const start = index * (2 + 12 + 12 + windowsPerRender) + 26;
      const slice = rects.slice(start, start + windowsPerRender);
      palette.dark ||= slice[slice.length - 1]!.fillStyle;
      return slice.filter((call) => call.fillStyle !== palette.dark).length;
    };

    const first = litWindowsOfRender(0);
    expect(clock.pending()).toBe(1);

    clock.advance(REVEAL_DURATION_MS / 3);
    const second = litWindowsOfRender(1);
    clock.advance(REVEAL_DURATION_MS / 3);
    const third = litWindowsOfRender(2);

    expect(first).toBeLessThan(second);
    expect(second).toBeLessThan(third);
  });

  test("stops scheduling frames once the reveal is complete", () => {
    const { canvas } = createRecordingCanvas();
    const clock = fakeClock();
    mountLandingHero(canvas, { now: clock.now, schedule: clock.schedule, reducedMotion: false });

    clock.advance(REVEAL_DURATION_MS + 1);
    expect(clock.pending()).toBe(0);
  });

  test("draws the finished city immediately when reduced motion is preferred", () => {
    const { canvas, calls } = createRecordingCanvas();
    const clock = fakeClock();
    mountLandingHero(canvas, { now: clock.now, schedule: clock.schedule, reducedMotion: true });

    expect(clock.pending()).toBe(0);
    expect(calls.filter((call) => call.method === "fillRect")).toHaveLength(2 + 12 + 12 + 420);
  });

  test("renders the caption in the page locale", () => {
    document.documentElement.lang = "en";
    const { canvas, calls } = createRecordingCanvas();
    mountLandingHero(canvas, { reducedMotion: true });

    const texts = calls.filter((call) => call.method === "fillText");
    expect(String(texts[0]?.args[0])).toContain("contributions");
    document.documentElement.lang = "pt-BR";
  });
});
