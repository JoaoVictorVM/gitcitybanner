import type { TranslationKey } from "../i18n/translations";
import type { CanvasDimensions } from "../layout/types";

export type DownloadPresetId = "x" | "linkedin";

export interface DownloadPreset {
  id: DownloadPresetId;
  dimensions: CanvasDimensions;
  filenameSuffix: string;
  labelKey: TranslationKey;
}

export const DOWNLOAD_ERROR_CODES = ["ENCODE_FAILED", "DOWNLOAD_BLOCKED"] as const;

export type DownloadErrorCode = (typeof DOWNLOAD_ERROR_CODES)[number];
