import type { DownloadPreset } from "./types";

export function buildDownloadFilename(username: string, preset: DownloadPreset): string {
  return `gitcitybanner-${username.toLowerCase()}-${preset.filenameSuffix}.png`;
}
