import type { ContributionModel, Day, Week } from "../contributions/types";
import { resolveLayoutConstants } from "./constants";
import type { BuildingLayout, CanvasDimensions, CityLayout, WindowRect } from "./types";

const BANDS_PER_BUILDING = 7;
const WINDOW_WIDTH = 10;
const MAX_WINDOW_HEIGHT = 14;
const MIN_BAND_HEIGHT = 4;

function weekTotal(week: Week): number {
  return week.days.reduce((total, day) => total + day.count, 0);
}

export function computeWindows(
  days: Day[],
  buildingX: number,
  buildingWidth: number,
  buildingTop: number,
  buildingHeight: number,
): WindowRect[] {
  const bandHeight = buildingHeight / BANDS_PER_BUILDING;
  if (bandHeight < MIN_BAND_HEIGHT) return [];

  const windowHeight = Math.min(bandHeight / 2, MAX_WINDOW_HEIGHT);
  const x = buildingX + (buildingWidth - WINDOW_WIDTH) / 2;

  return days.slice(0, BANDS_PER_BUILDING).map((day, bandIndex) => ({
    x,
    y: buildingTop + bandIndex * bandHeight + (bandHeight - windowHeight) / 2,
    width: WINDOW_WIDTH,
    height: windowHeight,
    level: day.level,
  }));
}

export function computeCityLayout(model: ContributionModel, canvas: CanvasDimensions): CityLayout {
  const constants = resolveLayoutConstants(canvas);
  const groundY = canvas.height - constants.groundLine;

  const totals = model.weeks.map(weekTotal);
  const maxWeekTotal = totals.reduce((max, total) => (total > max ? total : max), 0);
  const heightRange = constants.maxHeight - constants.minHeight;

  const buildings: BuildingLayout[] = model.weeks.map((week, weekIndex) => {
    const total = totals[weekIndex] ?? 0;
    const height =
      maxWeekTotal === 0
        ? constants.minHeight
        : constants.minHeight + (total / maxWeekTotal) * heightRange;
    const x = constants.padding + weekIndex * (constants.buildingWidth + constants.gap);

    return {
      x,
      width: constants.buildingWidth,
      height,
      windows: computeWindows(week.days, x, constants.buildingWidth, groundY - height, height),
    };
  });

  return { width: canvas.width, height: canvas.height, groundY, buildings };
}
