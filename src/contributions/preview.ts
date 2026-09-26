import type { Shell } from "../app";
import type { Locale } from "../i18n/translations";
import { t } from "../i18n/translations";
import type { CanvasDimensions } from "../layout/types";
import { renderBanner } from "../render/renderer";
import { dimModel } from "../render/reveal";
import type { ContributionModel } from "./types";

export const PREVIEW_DIMENSIONS: CanvasDimensions = { width: 1500, height: 500 };
export const REVEAL_DURATION_MS = 1200;

export interface RevealOptions {
  now?: () => number;
  schedule?: (callback: FrameRequestCallback) => unknown;
  reducedMotion?: boolean;
}

const CANVAS_SELECTOR = ".preview__canvas";
const ACTIONS_SELECTOR = ".preview__actions";
const HINT_SELECTOR = ".preview__hint";
const FILLED_CLASS = "preview--filled";

const USERNAME_PLACEHOLDER = "{username}";
const COUNT_PLACEHOLDER = "{count}";

function formatPreviewDescription(username: string, total: number, locale: Locale): string {
  const count = new Intl.NumberFormat(locale).format(total);
  return t(locale, "previewDescription")
    .replace(USERNAME_PLACEHOLDER, username)
    .replace(COUNT_PLACEHOLDER, count);
}

const generations = new WeakMap<HTMLCanvasElement, number>();

function prefersReducedMotion(): boolean {
  return typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function easeOut(fraction: number): number {
  return 1 - (1 - fraction) ** 3;
}

function revealBanner(
  canvas: HTMLCanvasElement,
  model: ContributionModel,
  locale: Locale,
  options: RevealOptions,
): void {
  const schedule =
    options.schedule ?? (typeof requestAnimationFrame === "function" ? requestAnimationFrame : undefined);
  const reducedMotion = options.reducedMotion ?? prefersReducedMotion();
  const generation = (generations.get(canvas) ?? 0) + 1;
  generations.set(canvas, generation);

  if (reducedMotion || !schedule) {
    renderBanner(canvas, model, PREVIEW_DIMENSIONS, locale);
    return;
  }

  const now = options.now ?? (() => performance.now());
  const start = now();
  const frame = (): void => {
    if (generations.get(canvas) !== generation) return;
    const progress = Math.min(1, (now() - start) / REVEAL_DURATION_MS);
    renderBanner(canvas, dimModel(model, easeOut(progress)), PREVIEW_DIMENSIONS, locale);
    if (progress < 1) schedule(frame);
  };
  frame();
}

export function renderPreview(
  shell: Shell,
  model: ContributionModel,
  locale: Locale,
  options: RevealOptions = {},
): void {
  const canvas = shell.preview.querySelector<HTMLCanvasElement>(CANVAS_SELECTOR);
  const actions = shell.preview.querySelector<HTMLElement>(ACTIONS_SELECTOR);
  if (!canvas || !actions) {
    throw new Error("preview section is missing the canvas or actions element");
  }

  revealBanner(canvas, model, locale, options);

  canvas.setAttribute("role", "img");
  canvas.setAttribute(
    "aria-label",
    formatPreviewDescription(model.username, model.totalContributions, locale),
  );

  const hint = shell.preview.querySelector<HTMLElement>(HINT_SELECTOR);
  if (hint) hint.hidden = true;

  canvas.hidden = false;
  actions.hidden = false;

  // Reading the layout before the class flips forces the browser to register the canvas'
  // initial opacity, so the reveal actually transitions instead of snapping in.
  void canvas.offsetWidth;
  shell.preview.classList.add(FILLED_CLASS);
}
