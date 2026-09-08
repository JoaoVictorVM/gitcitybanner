import { describe, expect, test } from "bun:test";

import { DownloadError, resolveDownloadErrorMessage } from "../../src/downloads/errors";
import { DOWNLOAD_ERROR_CODES } from "../../src/downloads/types";
import { LOCALES, translations } from "../../src/i18n/translations";

const EXPECTED_KEYS = {
  ENCODE_FAILED: "errorExportFailed",
  DOWNLOAD_BLOCKED: "errorDownloadBlocked",
} as const;

describe("download errors", () => {
  test("carries the code on the error instance", () => {
    const error = new DownloadError("DOWNLOAD_BLOCKED");
    expect(error).toBeInstanceOf(Error);
    expect(error.name).toBe("DownloadError");
    expect(error.code).toBe("DOWNLOAD_BLOCKED");
  });

  test("returns the PRD copy for every code and locale", () => {
    for (const locale of LOCALES) {
      for (const code of DOWNLOAD_ERROR_CODES) {
        expect(resolveDownloadErrorMessage(code, locale)).toBe(
          translations[locale][EXPECTED_KEYS[code]],
        );
      }
    }
  });

  test("keeps the exact pt-BR and en wording", () => {
    expect(resolveDownloadErrorMessage("ENCODE_FAILED", "pt-BR")).toBe(
      "Não foi possível gerar o arquivo. Tente de novo.",
    );
    expect(resolveDownloadErrorMessage("ENCODE_FAILED", "en")).toBe(
      "Could not generate the file. Please try again.",
    );
    expect(resolveDownloadErrorMessage("DOWNLOAD_BLOCKED", "pt-BR")).toBe(
      "Seu navegador bloqueou o download. Permita downloads deste site e tente de novo.",
    );
    expect(resolveDownloadErrorMessage("DOWNLOAD_BLOCKED", "en")).toBe(
      "Your browser blocked the download. Allow downloads from this site and try again.",
    );
  });
});
