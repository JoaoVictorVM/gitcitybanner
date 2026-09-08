import type { Shell } from "../app";
import type { ContributionModel } from "../contributions/types";
import { createDownloadButtons } from "./buttons";

export interface DownloadsMount {
  onBannerReady(model: ContributionModel): void;
}

export function mountDownloadButtons(shell: Shell): DownloadsMount {
  const buttons = createDownloadButtons(shell.downloads);

  return {
    onBannerReady(): void {
      buttons.reveal();
    },
  };
}
