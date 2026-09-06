import { t } from "../i18n/locale";
import type { Locale, TranslationKey } from "../i18n/translations";
import { DEFAULT_RETRY_AFTER_SECONDS } from "./client";
import type { ContributionErrorCode, ContributionFetchError } from "./types";

const SECONDS_PER_MINUTE = 60;
const MINUTES_PLACEHOLDER = "{minutes}";

const KEY_BY_CODE: Record<ContributionErrorCode, TranslationKey> = {
  USER_NOT_FOUND: "errorUserNotFound",
  RATE_LIMITED: "errorRateLimited",
  PARSE_FAILED: "errorServiceUnavailable",
  UPSTREAM_UNAVAILABLE: "errorServiceUnavailable",
  INVALID_USERNAME: "errorServiceUnavailable",
  INVALID_RESPONSE: "errorServiceUnavailable",
  NETWORK_OR_TIMEOUT: "errorConnectionFailed",
};

export function resolveErrorMessage(error: ContributionFetchError, locale: Locale): string {
  const message = t(KEY_BY_CODE[error.code], locale);
  if (error.code !== "RATE_LIMITED") return message;

  const seconds = error.retryAfterSeconds ?? DEFAULT_RETRY_AFTER_SECONDS;
  const minutes = Math.max(1, Math.ceil(seconds / SECONDS_PER_MINUTE));
  return message.replace(MINUTES_PLACEHOLDER, String(minutes));
}
