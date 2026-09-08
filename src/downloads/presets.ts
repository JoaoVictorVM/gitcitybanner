import type { DownloadPreset } from "./types";

export const DOWNLOAD_PRESETS: readonly DownloadPreset[] = [
  {
    id: "x",
    dimensions: { width: 1500, height: 500 },
    filenameSuffix: "x",
    labelKey: "downloadXLabel",
  },
  {
    id: "linkedin",
    dimensions: { width: 1584, height: 396 },
    filenameSuffix: "linkedin",
    labelKey: "downloadLinkedInLabel",
  },
];
