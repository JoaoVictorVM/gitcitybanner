import type { ContributionModel } from "../contributions/types";

function clamp(fraction: number): number {
  if (fraction < 0) return 0;
  if (fraction > 1) return 1;
  return fraction;
}

export function dimModel(model: ContributionModel, fraction: number): ContributionModel {
  const totalDays = model.weeks.reduce((sum, week) => sum + week.days.length, 0);
  const litDays = Math.floor(clamp(fraction) * totalDays);
  let index = 0;

  return {
    ...model,
    weeks: model.weeks.map((week) => ({
      days: week.days.map((day) => {
        const lit = index < litDays;
        index += 1;
        return lit ? day : { ...day, level: 0 };
      }),
    })),
  };
}
