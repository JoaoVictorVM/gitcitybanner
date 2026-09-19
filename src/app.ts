import { getLocale, t } from "./i18n/locale";
import { mountContributionRetrieval } from "./contributions/bootstrap";
import { mountDownloadButtons } from "./downloads/bootstrap";
import { mountLandingHero } from "./landing/hero";
import { isLocale } from "./i18n/translations";
import type { TranslationKey } from "./i18n/translations";

export interface Shell {
  root: HTMLElement;
  preview: HTMLElement;
  downloads: HTMLElement;
}

function applyTranslations(root: ParentNode = document): void {
  const locale = getLocale();

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
  const downloads = document.getElementById("downloads");
  if (!root || !preview || !downloads) return null;
  return { root, preview, downloads };
}

export function bootstrap(): Shell | null {
  if (!isLocale(document.documentElement.lang)) {
    console.warn(`[gitcitybanner] unknown lang "${document.documentElement.lang}", falling back to default locale`);
  }
  applyTranslations();
  const hero = document.querySelector<HTMLCanvasElement>("canvas[data-landing-hero]");
  if (hero) mountLandingHero(hero);
  const shell = getShell();
  if (shell) {
    const downloads = mountDownloadButtons(shell);
    mountContributionRetrieval(shell, downloads.onBannerReady);
  }
  return shell;
}

bootstrap();
