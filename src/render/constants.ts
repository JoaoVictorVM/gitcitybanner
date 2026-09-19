import type { CanvasDimensions } from "../layout/types";

export interface RenderConstants {
  captionFontSize: number;
  footerFontSize: number;
  captionOffset: { left: number; top: number };
  footerOffset: { right: number; bottom: number };
}

export const FONT_FAMILY =
  'ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';

export const CAPTION_FONT_WEIGHT = 600;
export const FOOTER_FONT_WEIGHT = 400;

export const CAPTION_COLOR = "#e6edf3";
export const FOOTER_COLOR = "#8b949e";

export const RENDER_CONSTANTS: Record<string, RenderConstants> = {
  "1500x500": {
    captionFontSize: 28,
    footerFontSize: 20,
    captionOffset: { left: 40, top: 44 },
    footerOffset: { right: 16, bottom: 16 },
  },
  "1584x396": {
    captionFontSize: 25,
    footerFontSize: 18,
    captionOffset: { left: 36, top: 40 },
    footerOffset: { right: 14, bottom: 14 },
  },
};

export function resolveRenderConstants(canvas: CanvasDimensions): RenderConstants {
  const key = `${canvas.width}x${canvas.height}`;
  const constants = RENDER_CONSTANTS[key];
  if (!constants) {
    throw new Error(
      `Unsupported canvas size ${key}. Supported sizes: ${Object.keys(RENDER_CONSTANTS).join(", ")}.`,
    );
  }
  return constants;
}
