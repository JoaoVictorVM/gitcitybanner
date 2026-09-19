import type { ContributionModel } from "../contributions/types";
import { getLocale } from "../i18n/locale";
import type { CanvasDimensions } from "../layout/types";
import { renderBanner } from "../render/renderer";
import sample from "./sample.json";

export const HERO_DIMENSIONS: CanvasDimensions = { width: 1500, height: 500 };
export const REVEAL_DURATION_MS = 1500;

export const sampleModel: ContributionModel = sample;

export interface HeroOptions {
  now?: () => number;
  schedule?: (callback: FrameRequestCallback) => number;
  reducedMotion?: boolean;
}

function clamp(fraction: number): number {
  if (fraction < 0) return 0;
  if (fraction > 1) return 1;
  return fraction;
}

function easeOut(fraction: number): number {
  return 1 - (1 - fraction) ** 3;
}

export function dimModel(model: ContributionModel, fraction: number): ContributionModel {
  const totalDays = model.weeks.reduce((sum, week) => sum + week.days.length, 0);
  const litDays = Math.floor(clamp(fraction) * totalDays);
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

function prefersReducedMotion(): boolean {
  return typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function mountLandingHero(canvas: HTMLCanvasElement, options: HeroOptions = {}): void {
  const now = options.now ?? (() => performance.now());
  const schedule = options.schedule ?? ((callback) => requestAnimationFrame(callback));
  const reducedMotion = options.reducedMotion ?? prefersReducedMotion();
  const locale = getLocale();

  if (reducedMotion) {
    renderBanner(canvas, sampleModel, HERO_DIMENSIONS, locale);
    return;
  }

  const start = now();
  const frame = (): void => {
    const elapsed = now() - start;
    const progress = clamp(elapsed / REVEAL_DURATION_MS);
    renderBanner(canvas, dimModel(sampleModel, easeOut(progress)), HERO_DIMENSIONS, locale);
    if (progress < 1) schedule(frame);
  };

  frame();
}
