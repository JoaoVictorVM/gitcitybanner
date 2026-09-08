import { getContributionModel } from "../contributions/session";
import type { ContributionModel } from "../contributions/types";
import { getLocale } from "../i18n/locale";
import type { Locale } from "../i18n/translations";
import { t } from "../i18n/translations";
import { DownloadError, resolveDownloadErrorMessage } from "./errors";
import { exportBanner } from "./export";
import { DOWNLOAD_PRESETS } from "./presets";
import type { DownloadPreset, DownloadPresetId } from "./types";

export type BannerExporter = (
  preset: DownloadPreset,
  model: ContributionModel,
  locale: Locale,
) => Promise<void>;

export interface DownloadButtons {
  reveal(): void;
  setBusy(presetId: DownloadPresetId, busy: boolean): void;
  showError(message: string): void;
  clearError(): void;
}

const PENDING_CLASS = "downloads__button--pending";

function toErrorCode(error: unknown): DownloadError["code"] {
  return error instanceof DownloadError ? error.code : "ENCODE_FAILED";
}

export function createDownloadButtons(
  container: HTMLElement,
  exporter: BannerExporter = exportBanner,
): DownloadButtons {
  const locale = getLocale();
  const buttons = new Map<DownloadPresetId, HTMLButtonElement>();
  let revealed = false;
  let encoding = false;

  const error = document.createElement("p");
  error.className = "downloads__error";
  error.setAttribute("aria-live", "polite");

  function showError(message: string): void {
    error.textContent = message;
  }

  function clearError(): void {
    error.textContent = "";
  }

  function setBusy(presetId: DownloadPresetId, busy: boolean): void {
    const button = buttons.get(presetId);
    if (!button) return;
    button.disabled = busy || !revealed;
    button.classList.toggle(PENDING_CLASS, busy);
    if (busy) button.setAttribute("aria-busy", "true");
    else button.removeAttribute("aria-busy");
  }

  function handleClick(preset: DownloadPreset): void {
    if (encoding) return;

    const model = getContributionModel();
    if (!model) {
      console.warn("[gitcitybanner] no contribution model available; ignoring download click");
      return;
    }

    encoding = true;
    clearError();
    setBusy(preset.id, true);

    void exporter(preset, model, getLocale()).then(
      () => {
        encoding = false;
        setBusy(preset.id, false);
      },
      (reason: unknown) => {
        encoding = false;
        setBusy(preset.id, false);
        showError(resolveDownloadErrorMessage(toErrorCode(reason), getLocale()));
      },
    );
  }

  for (const preset of DOWNLOAD_PRESETS) {
    const button = document.createElement("button");
    button.className = "downloads__button";
    button.type = "button";
    button.disabled = true;
    button.dataset.preset = preset.id;
    button.textContent = t(locale, preset.labelKey);
    button.addEventListener("click", () => handleClick(preset));
    buttons.set(preset.id, button);
    container.append(button);
  }

  container.append(error);

  return {
    reveal(): void {
      revealed = true;
      container.hidden = false;
      for (const [presetId] of buttons) setBusy(presetId, false);
    },
    setBusy,
    showError,
    clearError,
  };
}
