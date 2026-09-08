export type { ContributionModel, Day, Week } from "../contributions/types";

export interface CanvasDimensions {
  width: number;
  height: number;
}

export interface Point {
  x: number;
  y: number;
}

export interface WindowRect {
  x: number;
  y: number;
  width: number;
  height: number;
  level: number;
}

export interface RoofShape {
  left: Point;
  apex: Point;
  right: Point;
}

export interface ChimneyRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface BuildingLayout {
  x: number;
  width: number;
  height: number;
  roof: RoofShape;
  chimney: ChimneyRect;
  windows: WindowRect[];
}

export interface CityLayout {
  width: number;
  height: number;
  groundY: number;
  buildings: BuildingLayout[];
}
