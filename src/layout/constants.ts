import type { CanvasDimensions } from "./types";

export interface LayoutConstants {
  padding: number;
  gap: number;
  buildingWidth: number;
  minHeight: number;
  maxHeight: number;
  groundLine: number;
}

export const LAYOUT_CONSTANTS: Record<string, LayoutConstants> = {
  "1500x500": {
    padding: 60,
    gap: 6,
    buildingWidth: 20,
    minHeight: 40,
    maxHeight: 380,
    groundLine: 40,
  },
  "1584x396": {
    padding: 64,
    gap: 6,
    buildingWidth: 21,
    minHeight: 32,
    maxHeight: 290,
    groundLine: 34,
  },
};

export function resolveLayoutConstants(canvas: CanvasDimensions): LayoutConstants {
  const key = `${canvas.width}x${canvas.height}`;
  const constants = LAYOUT_CONSTANTS[key];
  if (!constants) {
    throw new Error(
      `Unsupported canvas size ${key}. Supported sizes: ${Object.keys(LAYOUT_CONSTANTS).join(", ")}.`,
    );
  }
  return constants;
}
