import { SITE_DOMAIN } from "../config";
import type { Locale } from "../i18n/translations";
import { t } from "../i18n/translations";

const USERNAME_PLACEHOLDER = "{username}";
const COUNT_PLACEHOLDER = "{count}";

export function formatCaptionText(username: string, total: number, locale: Locale): string {
  const count = new Intl.NumberFormat(locale).format(total);
  return t(locale, "bannerCaption")
    .replace(USERNAME_PLACEHOLDER, username)
    .replace(COUNT_PLACEHOLDER, count);
}

export function formatFooterText(): string {
  return SITE_DOMAIN;
}
