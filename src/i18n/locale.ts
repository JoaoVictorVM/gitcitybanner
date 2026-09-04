import { DEFAULT_LOCALE, isLocale, t as translate } from "./translations";
import type { Locale, TranslationKey } from "./translations";

export function getLocale(documentElement: HTMLElement = document.documentElement): Locale {
  const lang = documentElement.lang;
  return isLocale(lang) ? lang : DEFAULT_LOCALE;
}

export function t(key: TranslationKey, locale: Locale = getLocale()): string {
  return translate(locale, key);
}
