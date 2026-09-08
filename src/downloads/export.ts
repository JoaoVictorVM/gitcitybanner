import type { ContributionModel } from "../contributions/types";
import type { Locale } from "../i18n/translations";
import { renderBanner } from "../render/renderer";
import { DownloadError } from "./errors";
import { buildDownloadFilename } from "./filename";
import type { DownloadPreset } from "./types";

function encodePng(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    try {
      canvas.toBlob((blob) => {
        if (blob) resolve(blob);
        else reject(new DownloadError("ENCODE_FAILED"));
      }, "image/png");
    } catch {
      reject(new DownloadError("ENCODE_FAILED"));
    }
  });
}

function triggerDownload(blob: Blob, filename: string): void {
  let url: string | null = null;
  try {
    const anchor = document.createElement("a");
    url = URL.createObjectURL(blob);
    anchor.href = url;
    anchor.download = filename;
    anchor.rel = "noopener";
    anchor.click();
  } catch {
    throw new DownloadError("DOWNLOAD_BLOCKED");
  } finally {
    if (url) URL.revokeObjectURL(url);
  }
}

export async function exportBanner(
  preset: DownloadPreset,
  model: ContributionModel,
  locale: Locale,
): Promise<void> {
  const canvas = document.createElement("canvas");
  renderBanner(canvas, model, preset.dimensions, locale);

  const blob = await encodePng(canvas);
  triggerDownload(blob, buildDownloadFilename(model.username, preset));
}
