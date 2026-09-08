import type { Shell } from "../app";
import type { Locale } from "../i18n/translations";
import { t } from "../i18n/translations";
import type { CanvasDimensions } from "../layout/types";
import { renderBanner } from "../render/renderer";
import type { ContributionModel } from "./types";

export const PREVIEW_DIMENSIONS: CanvasDimensions = { width: 1500, height: 500 };

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

export function renderPreview(shell: Shell, model: ContributionModel, locale: Locale): void {
  const canvas = shell.preview.querySelector<HTMLCanvasElement>(CANVAS_SELECTOR);
  const actions = shell.preview.querySelector<HTMLElement>(ACTIONS_SELECTOR);
  if (!canvas || !actions) {
    throw new Error("preview section is missing the canvas or actions element");
  }

  renderBanner(canvas, model, PREVIEW_DIMENSIONS, locale);

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
