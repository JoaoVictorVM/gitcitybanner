import type { Locale } from "../i18n/translations";
import { t } from "../i18n/translations";

export function formatContributions(count: number, locale: Locale): string {
  if (count === 0) return t(locale, "contributionsNone");
  const key = count === 1 ? "contributionsOne" : "contributionsMany";
  return t(locale, key).replace("{count}", new Intl.NumberFormat(locale).format(count));
}

export function formatDay(date: string, locale: Locale): string {
  return new Intl.DateTimeFormat(locale, {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${date}T00:00:00Z`));
}
