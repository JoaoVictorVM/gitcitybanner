import type { ContributionModel } from "./types";

let lastModel: ContributionModel | null = null;

export function getContributionModel(): ContributionModel | null {
  return lastModel;
}

export function setContributionModel(model: ContributionModel): void {
  lastModel = model;
}

export function clearContributionModel(): void {
  lastModel = null;
}
