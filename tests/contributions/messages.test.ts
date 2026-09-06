import { describe, expect, test } from "bun:test";

import { translations } from "../../src/i18n/translations";
import type { Locale } from "../../src/i18n/translations";
import { resolveErrorMessage } from "../../src/contributions/messages";
import { CONTRIBUTION_ERROR_CODES, ContributionFetchError } from "../../src/contributions/types";

const LOCALES: Locale[] = ["pt-BR", "en"];

describe("resolveErrorMessage", () => {
  test("returns the exact PRD copy for every code and locale", () => {
    const expected: Record<string, keyof (typeof translations)["en"]> = {
      USER_NOT_FOUND: "errorUserNotFound",
      PARSE_FAILED: "errorServiceUnavailable",
      UPSTREAM_UNAVAILABLE: "errorServiceUnavailable",
      INVALID_USERNAME: "errorServiceUnavailable",
      INVALID_RESPONSE: "errorServiceUnavailable",
      NETWORK_OR_TIMEOUT: "errorConnectionFailed",
    };

    for (const locale of LOCALES) {
      for (const code of CONTRIBUTION_ERROR_CODES) {
        if (code === "RATE_LIMITED") continue;
        const message = resolveErrorMessage(new ContributionFetchError(code), locale);
        expect(message, `${locale}.${code}`).toBe(translations[locale][expected[code]!]);
      }
    }
  });

  test("keeps the user-not-found message distinct from the service-unavailable one", () => {
    for (const locale of LOCALES) {
      expect(resolveErrorMessage(new ContributionFetchError("USER_NOT_FOUND"), locale)).not.toBe(
        resolveErrorMessage(new ContributionFetchError("PARSE_FAILED"), locale),
      );
    }
  });

  test("interpolates the wait rounded up to whole minutes", () => {
    expect(resolveErrorMessage(new ContributionFetchError("RATE_LIMITED", 61), "pt-BR")).toBe(
      "Muitas gerações em pouco tempo. Tente de novo em 2 minutos.",
    );
    expect(resolveErrorMessage(new ContributionFetchError("RATE_LIMITED", 120), "en")).toBe(
      "Too many generations in a short time. Try again in 2 minutes.",
    );
    expect(resolveErrorMessage(new ContributionFetchError("RATE_LIMITED", 5), "en")).toContain("1 minute");
  });

  test("leaves no placeholder in any rendered message", () => {
    for (const locale of LOCALES) {
      for (const code of CONTRIBUTION_ERROR_CODES) {
        expect(resolveErrorMessage(new ContributionFetchError(code, 90), locale)).not.toContain("{minutes}");
      }
    }
  });
});
