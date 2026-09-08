import type { ContributionModel } from "../contributions/types";
import { resolveLayoutConstants } from "./constants";
import type { LayoutConstants } from "./constants";
import { MONTHS_PER_CITY, groupDaysByMonth } from "./months";
import type {
  BuildingLayout,
  CanvasDimensions,
  ChimneyRect,
  CityLayout,
  RoofShape,
  WindowRect,
} from "./types";

export const GRID_COLUMNS = 5;
export const GRID_ROWS = 7;
export const GRID_SLOTS = GRID_COLUMNS * GRID_ROWS;

export function cellSizeOf(constants: LayoutConstants): number {
  return (constants.buildingWidth - 2 * constants.gridInset) / GRID_COLUMNS;
}

export function gridBlockHeightOf(constants: LayoutConstants): number {
  return constants.gridTopMargin + GRID_ROWS * cellSizeOf(constants) + constants.gridBottomMargin;
}

export function computeWindows(
  levels: number[],
  buildingX: number,
  buildingTop: number,
  constants: LayoutConstants,
): WindowRect[] {
  const cellSize = cellSizeOf(constants);
  const size = cellSize - constants.windowGutter;
  const offset = constants.windowGutter / 2;
  const left = buildingX + constants.gridInset + offset;
  const top = buildingTop + constants.gridTopMargin + offset;

  return Array.from({ length: GRID_SLOTS }, (_, slot) => ({
    x: left + Math.floor(slot / GRID_ROWS) * cellSize,
    y: top + (slot % GRID_ROWS) * cellSize,
    width: size,
    height: size,
    level: levels[slot] ?? 0,
  }));
}

export function computeRoof(
  buildingX: number,
  buildingTop: number,
  constants: LayoutConstants,
): RoofShape {
  return {
    left: { x: buildingX - constants.roofOverhang, y: buildingTop },
    apex: {
      x: buildingX + constants.buildingWidth / 2,
      y: buildingTop - constants.roofHeight,
    },
    right: {
      x: buildingX + constants.buildingWidth + constants.roofOverhang,
      y: buildingTop,
    },
  };
}

export function computeChimney(
  buildingX: number,
  buildingTop: number,
  constants: LayoutConstants,
): ChimneyRect {
  return {
    x: buildingX + constants.buildingWidth - constants.chimneyInset - constants.chimneyWidth,
    y: buildingTop - constants.chimneyHeight,
    width: constants.chimneyWidth,
    height: constants.chimneyHeight,
  };
}

export function computeCityLayout(model: ContributionModel, canvas: CanvasDimensions): CityLayout {
  const constants = resolveLayoutConstants(canvas);
  const groundY = canvas.height - constants.groundLine;
  const gridBlock = gridBlockHeightOf(constants);

  const cityWidth =
    MONTHS_PER_CITY * constants.buildingWidth + (MONTHS_PER_CITY - 1) * constants.gap;
  const originX = (canvas.width - cityWidth) / 2;

  const months = groupDaysByMonth(model, GRID_SLOTS);
  const height = gridBlock + constants.base;
  const top = groundY - height;

  const buildings: BuildingLayout[] = months.map((month, monthIndex) => {
    const x = originX + monthIndex * (constants.buildingWidth + constants.gap);

    return {
      x,
      width: constants.buildingWidth,
      height,
      roof: computeRoof(x, top, constants),
      chimney: computeChimney(x, top, constants),
      windows: computeWindows(month.levels, x, top, constants),
    };
  });

  return { width: canvas.width, height: canvas.height, groundY, buildings };
}
