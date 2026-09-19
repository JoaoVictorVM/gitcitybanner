import type { CanvasDimensions } from "./types";

export interface LayoutConstants {
  gap: number;
  buildingWidth: number;
  gridInset: number;
  gridTopMargin: number;
  gridBottomMargin: number;
  windowGutter: number;
  base: number;
  groundLine: number;
  roofHeight: number;
  roofOverhang: number;
  chimneyWidth: number;
  chimneyHeight: number;
  chimneyInset: number;
}

export const LAYOUT_CONSTANTS: Record<string, LayoutConstants> = {
  "1500x500": {
    gap: 26,
    buildingWidth: 96,
    gridInset: 8,
    gridTopMargin: 12,
    gridBottomMargin: 12,
    windowGutter: 3,
    base: 36,
    groundLine: 52,
    roofHeight: 36,
    roofOverhang: 9,
    chimneyWidth: 9,
    chimneyHeight: 32,
    chimneyInset: 18,
  },
  "1584x396": {
    gap: 26,
    buildingWidth: 100,
    gridInset: 10,
    gridTopMargin: 10,
    gridBottomMargin: 10,
    windowGutter: 3,
    base: 28,
    groundLine: 46,
    roofHeight: 32,
    roofOverhang: 8,
    chimneyWidth: 8,
    chimneyHeight: 28,
    chimneyInset: 16,
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
