import { registerDom } from "../dom";

registerDom();

const { afterEach, beforeEach, describe, expect, test } = await import("bun:test");
const { createDownloadButtons } = await import("../../src/downloads/buttons");
const { DownloadError } = await import("../../src/downloads/errors");
const { DOWNLOAD_PRESETS } = await import("../../src/downloads/presets");
const { clearContributionModel, setContributionModel } = await import(
  "../../src/contributions/session"
);
const { translations } = await import("../../src/i18n/translations");
import type { BannerExporter } from "../../src/downloads/buttons";
import type { DownloadPreset } from "../../src/downloads/types";
import type { ContributionModel } from "../../src/contributions/types";
import type { Locale } from "../../src/i18n/translations";
import { buildModel } from "../contributions/fixture";

interface DeferredExport {
  preset: DownloadPreset;
  model: ContributionModel;
  locale: Locale;
  resolve: () => void;
  reject: (reason: unknown) => void;
}

interface Harness {
  container: HTMLElement;
  buttons: ReturnType<typeof createDownloadButtons>;
  calls: DeferredExport[];
  xButton: HTMLButtonElement;
  linkedInButton: HTMLButtonElement;
  error: HTMLElement;
}

function harness(locale: Locale = "pt-BR"): Harness {
  document.documentElement.lang = locale;
  document.body.innerHTML = `<div id="downloads" class="preview__actions" hidden></div>`;
  const container = document.getElementById("downloads")!;
  const calls: DeferredExport[] = [];

  const exporter: BannerExporter = (preset, model, exportLocale) =>
    new Promise<void>((resolve, reject) => {
      calls.push({ preset, model, locale: exportLocale, resolve: () => resolve(), reject });
    });

  const buttons = createDownloadButtons(container, exporter);

  return {
    container,
    buttons,
    calls,
    xButton: container.querySelector<HTMLButtonElement>('[data-preset="x"]')!,
    linkedInButton: container.querySelector<HTMLButtonElement>('[data-preset="linkedin"]')!,
    error: container.querySelector<HTMLElement>(".downloads__error")!,
  };
}

const flush = (): Promise<void> => new Promise<void>((resolve) => setTimeout(resolve, 0));

describe("download buttons", () => {
  let mounted: Harness;

  beforeEach(() => {
    setContributionModel(buildModel());
    mounted = harness();
  });

  afterEach(() => {
    clearContributionModel();
  });

  test("renders one labelled button per preset", () => {
    expect(mounted.xButton.textContent).toBe(translations["pt-BR"].downloadXLabel);
    expect(mounted.linkedInButton.textContent).toBe(translations["pt-BR"].downloadLinkedInLabel);
    expect(mounted.container.querySelectorAll("button")).toHaveLength(DOWNLOAD_PRESETS.length);
  });

  test("labels the buttons in the active locale", () => {
    const english = harness("en");
    expect(english.xButton.textContent).toBe(translations.en.downloadXLabel);
    expect(english.linkedInButton.textContent).toBe(translations.en.downloadLinkedInLabel);
  });

  test("stays hidden and disabled until reveal", () => {
    expect(mounted.container.hidden).toBe(true);
    expect(mounted.xButton.disabled).toBe(true);
    expect(mounted.linkedInButton.disabled).toBe(true);

    mounted.buttons.reveal();

    expect(mounted.container.hidden).toBe(false);
    expect(mounted.xButton.disabled).toBe(false);
    expect(mounted.linkedInButton.disabled).toBe(false);
  });

  test("reveal is idempotent", () => {
    mounted.buttons.reveal();
    mounted.buttons.reveal();

    expect(mounted.container.querySelectorAll("button")).toHaveLength(DOWNLOAD_PRESETS.length);
    expect(mounted.container.querySelectorAll(".downloads__error")).toHaveLength(1);
  });

  test("a click marks only the clicked button as pending", () => {
    mounted.buttons.reveal();
    mounted.xButton.click();

    expect(mounted.calls).toHaveLength(1);
    expect(mounted.calls[0]!.preset.id).toBe("x");
    expect(mounted.xButton.disabled).toBe(true);
    expect(mounted.xButton.classList.contains("downloads__button--pending")).toBe(true);
    expect(mounted.linkedInButton.disabled).toBe(false);
    expect(mounted.linkedInButton.classList.contains("downloads__button--pending")).toBe(false);
  });

  test("ignores a second click while an export is encoding", () => {
    mounted.buttons.reveal();
    mounted.xButton.click();
    mounted.linkedInButton.click();

    expect(mounted.calls).toHaveLength(1);
    expect(mounted.calls[0]!.preset.id).toBe("x");
  });

  test("returns to idle after a successful export", async () => {
    mounted.buttons.reveal();
    mounted.xButton.click();
    mounted.calls[0]!.resolve();
    await flush();

    expect(mounted.xButton.disabled).toBe(false);
    expect(mounted.xButton.classList.contains("downloads__button--pending")).toBe(false);
    expect(mounted.linkedInButton.disabled).toBe(false);

    mounted.linkedInButton.click();
    expect(mounted.calls).toHaveLength(2);
  });

  test("shows the localized error message and clears it on the next export", async () => {
    mounted.buttons.reveal();
    mounted.xButton.click();
    mounted.calls[0]!.reject(new DownloadError("DOWNLOAD_BLOCKED"));
    await flush();

    expect(mounted.error.textContent).toBe(translations["pt-BR"].errorDownloadBlocked);

    mounted.xButton.click();
    expect(mounted.error.textContent).toBe("");
    mounted.calls[1]!.resolve();
    await flush();
    expect(mounted.error.textContent).toBe("");
  });

  test("keeps both buttons intact after an encode failure", async () => {
    mounted.buttons.reveal();
    mounted.xButton.click();
    mounted.calls[0]!.reject(new DownloadError("ENCODE_FAILED"));
    await flush();

    expect(mounted.error.textContent).toBe(translations["pt-BR"].errorExportFailed);
    expect(mounted.container.hidden).toBe(false);
    expect(mounted.xButton.isConnected).toBe(true);
    expect(mounted.linkedInButton.isConnected).toBe(true);
    expect(mounted.xButton.disabled).toBe(false);
    expect(mounted.linkedInButton.disabled).toBe(false);
  });

  test("maps an unknown rejection to the file-generation message", async () => {
    mounted.buttons.reveal();
    mounted.xButton.click();
    mounted.calls[0]!.reject(new Error("boom"));
    await flush();

    expect(mounted.error.textContent).toBe(translations["pt-BR"].errorExportFailed);
  });

  test("ignores a click while no banner exists", () => {
    clearContributionModel();
    mounted.buttons.reveal();
    mounted.xButton.click();

    expect(mounted.calls).toHaveLength(0);
  });

  test("passes the session model and active locale to the exporter", () => {
    const model = buildModel({ username: "Torvalds", totalContributions: 42 });
    setContributionModel(model);
    mounted.buttons.reveal();
    mounted.linkedInButton.click();

    expect(mounted.calls[0]!.model).toBe(model);
    expect(mounted.calls[0]!.locale).toBe("pt-BR");
  });
});
