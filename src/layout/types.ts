export type { ContributionModel, Day, Week } from "../contributions/types";

export interface CanvasDimensions {
  width: number;
  height: number;
}

export interface WindowRect {
  x: number;
  y: number;
  width: number;
  height: number;
  level: number;
}

export interface BuildingLayout {
  x: number;
  width: number;
  height: number;
  windows: WindowRect[];
}

export interface CityLayout {
  width: number;
  height: number;
  groundY: number;
  buildings: BuildingLayout[];
}
