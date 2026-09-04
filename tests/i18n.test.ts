import { describe, expect, test } from "bun:test";
import { LOCALES, translations, t, isLocale, DEFAULT_LOCALE } from "../src/i18n/translations";
import { getLocale } from "../src/i18n/locale";

describe("translations", () => {
  test("translation keys match across locales", () => {
    const [first, ...rest] = LOCALES;
    const reference = Object.keys(translations[first!]).sort();
    for (const locale of rest) {
      expect(Object.keys(translations[locale]).sort()).toEqual(reference);
    }
  });

  test("no translated string is empty", () => {
    for (const locale of LOCALES) {
      for (const [key, value] of Object.entries(translations[locale])) {
        expect(value.trim(), `${locale}.${key}`).not.toBe("");
      }
    }
  });

  test("t returns the localized string", () => {
    const pt = t("pt-BR", "tagline");
    const en = t("en", "tagline");
    expect(pt).not.toBe("");
    expect(en).not.toBe("");
    expect(pt).not.toBe(en);
  });

  test("isLocale accepts only the supported locales", () => {
    expect(isLocale("pt-BR")).toBe(true);
    expect(isLocale("en")).toBe(true);
    expect(isLocale("es")).toBe(false);
  });
});

describe("locale resolution", () => {
  test("reads the active locale from the document element lang", () => {
    expect(getLocale({ lang: "en" } as HTMLElement)).toBe("en");
    expect(getLocale({ lang: "pt-BR" } as HTMLElement)).toBe("pt-BR");
  });

  test("falls back to the default locale for an unknown lang", () => {
    expect(getLocale({ lang: "fr" } as HTMLElement)).toBe(DEFAULT_LOCALE);
  });
});
