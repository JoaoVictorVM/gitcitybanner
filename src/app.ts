import { getLocale, t } from "./i18n/locale";
import { isLocale } from "./i18n/translations";
import type { TranslationKey } from "./i18n/translations";

export interface Shell {
  root: HTMLElement;
  preview: HTMLElement;
}

function applyTranslations(root: ParentNode = document): void {
  const locale = getLocale();
  document.title = t("documentTitle", locale);

  for (const element of root.querySelectorAll<HTMLElement>("[data-i18n]")) {
    const key = element.dataset.i18n;
    if (key) element.textContent = t(key as TranslationKey, locale);
  }

  for (const element of root.querySelectorAll<HTMLElement>("[data-i18n-aria-label]")) {
    const key = element.dataset.i18nAriaLabel;
    if (key) element.setAttribute("aria-label", t(key as TranslationKey, locale));
  }
}

function getShell(): Shell | null {
  const root = document.getElementById("app");
  const preview = document.getElementById("preview");
  if (!root || !preview) return null;
  return { root, preview };
}

export function bootstrap(): Shell | null {
  if (!isLocale(document.documentElement.lang)) {
    console.warn(`[gitcitybanner] unknown lang "${document.documentElement.lang}", falling back to default locale`);
  }
  applyTranslations();
  return getShell();
}

bootstrap();
