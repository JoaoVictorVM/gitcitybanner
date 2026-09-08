import type { ContributionModel } from "../contributions/types";
import type { Locale } from "../i18n/translations";
import { computeCityLayout } from "../layout/compute-layout";
import type { BuildingLayout, CanvasDimensions, CityLayout } from "../layout/types";
import { formatCaptionText, formatFooterText } from "./captions";
import {
  CAPTION_COLOR,
  CAPTION_FONT_WEIGHT,
  FONT_FAMILY,
  FOOTER_COLOR,
  FOOTER_FONT_WEIGHT,
  resolveRenderConstants,
} from "./constants";
import type { RenderConstants } from "./constants";
import { resolvePalette } from "./palette";
import type { Palette } from "./palette";

function drawRoof(ctx: CanvasRenderingContext2D, roof: BuildingLayout["roof"]): void {
  ctx.beginPath();
  ctx.moveTo(roof.left.x, roof.left.y);
  ctx.lineTo(roof.apex.x, roof.apex.y);
  ctx.lineTo(roof.right.x, roof.right.y);
  ctx.closePath();
  ctx.fill();
}

function drawScene(ctx: CanvasRenderingContext2D, layout: CityLayout, palette: Palette): void {
  ctx.fillStyle = palette.sky;
  ctx.fillRect(0, 0, layout.width, layout.height);

  ctx.fillStyle = palette.ground;
  ctx.fillRect(0, layout.groundY, layout.width, layout.height - layout.groundY);

  ctx.fillStyle = palette.roof;
  for (const building of layout.buildings) {
    const chimney = building.chimney;
    ctx.fillRect(chimney.x, chimney.y, chimney.width, chimney.height);
    drawRoof(ctx, building.roof);
  }

  ctx.fillStyle = palette.building;
  for (const building of layout.buildings) {
    ctx.fillRect(building.x, layout.groundY - building.height, building.width, building.height);
  }

  for (const building of layout.buildings) {
    for (const window of building.windows) {
      ctx.fillStyle = palette.windows[window.level] ?? palette.windows[0];
      ctx.fillRect(window.x, window.y, window.width, window.height);
    }
  }
}

function drawCaptions(
  ctx: CanvasRenderingContext2D,
  layout: CityLayout,
  constants: RenderConstants,
  model: ContributionModel,
  locale: Locale,
): void {
  ctx.textAlign = "left";
  ctx.textBaseline = "top";
  ctx.font = `${CAPTION_FONT_WEIGHT} ${constants.captionFontSize}px ${FONT_FAMILY}`;
  ctx.fillStyle = CAPTION_COLOR;
  ctx.fillText(
    formatCaptionText(model.username, model.totalContributions, locale),
    constants.captionOffset.left,
    constants.captionOffset.top,
  );

  ctx.textAlign = "right";
  ctx.textBaseline = "bottom";
  ctx.font = `${FOOTER_FONT_WEIGHT} ${constants.footerFontSize}px ${FONT_FAMILY}`;
  ctx.fillStyle = FOOTER_COLOR;
  ctx.fillText(
    formatFooterText(),
    layout.width - constants.footerOffset.right,
    layout.height - constants.footerOffset.bottom,
  );
}

export function renderBanner(
  canvas: HTMLCanvasElement,
  model: ContributionModel,
  dimensions: CanvasDimensions,
  locale: Locale,
): HTMLCanvasElement {
  const constants = resolveRenderConstants(dimensions);

  canvas.width = dimensions.width;
  canvas.height = dimensions.height;

  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas 2D context is unavailable.");

  const layout = computeCityLayout(model, dimensions);
  const palette = resolvePalette();

  drawScene(ctx, layout, palette);
  drawCaptions(ctx, layout, constants, model, locale);

  return canvas;
}
