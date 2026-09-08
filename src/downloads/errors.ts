import type { Locale, TranslationKey } from "../i18n/translations";
import { t } from "../i18n/translations";
import type { DownloadErrorCode } from "./types";

const MESSAGE_KEYS: Record<DownloadErrorCode, TranslationKey> = {
  ENCODE_FAILED: "errorExportFailed",
  DOWNLOAD_BLOCKED: "errorDownloadBlocked",
};

export class DownloadError extends Error {
  readonly code: DownloadErrorCode;

  constructor(code: DownloadErrorCode) {
    super(code);
    this.name = "DownloadError";
    this.code = code;
  }
}

export function resolveDownloadErrorMessage(code: DownloadErrorCode, locale: Locale): string {
  return t(locale, MESSAGE_KEYS[code]);
}
