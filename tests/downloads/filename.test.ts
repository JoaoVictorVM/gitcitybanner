import { describe, expect, test } from "bun:test";

import { buildDownloadFilename } from "../../src/downloads/filename";
import { DOWNLOAD_PRESETS } from "../../src/downloads/presets";

const [X_PRESET, LINKEDIN_PRESET] = DOWNLOAD_PRESETS;

describe("download filename", () => {
  test("builds the X filename with the username lowercased", () => {
    expect(buildDownloadFilename("Torvalds", X_PRESET!)).toBe("gitcitybanner-torvalds-x.png");
  });

  test("builds the LinkedIn filename with the username lowercased", () => {
    expect(buildDownloadFilename("Torvalds", LINKEDIN_PRESET!)).toBe(
      "gitcitybanner-torvalds-linkedin.png",
    );
  });
});

describe("download presets", () => {
  test("exposes the two PRD presets with their exact dimensions", () => {
    expect(DOWNLOAD_PRESETS.map((preset) => [preset.id, preset.dimensions])).toEqual([
      ["x", { width: 1500, height: 500 }],
      ["linkedin", { width: 1584, height: 396 }],
    ]);
  });
});
