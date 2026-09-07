import { afterEach, describe, expect, test } from "bun:test";

import { resolvePalette } from "../../src/render/palette";
import { registerDom } from "../dom";

registerDom();

const TOKENS = ["--sky", "--ground", "--building", "--window-0", "--window-1", "--window-2", "--window-3", "--window-4"];

afterEach(() => {
  for (const token of TOKENS) document.documentElement.style.removeProperty(token);
});

describe("resolvePalette", () => {
  test("reads the CSS custom properties when present", () => {
    document.documentElement.style.setProperty("--sky", "#111111");
    document.documentElement.style.setProperty("--ground", "#222222");
    document.documentElement.style.setProperty("--building", "#333333");
    document.documentElement.style.setProperty("--window-0", "#440000");
    document.documentElement.style.setProperty("--window-1", "#441111");
    document.documentElement.style.setProperty("--window-2", "#442222");
    document.documentElement.style.setProperty("--window-3", "#443333");
    document.documentElement.style.setProperty("--window-4", "#444444");

    expect(resolvePalette()).toEqual({
      sky: "#111111",
      ground: "#222222",
      building: "#333333",
      windows: ["#440000", "#441111", "#442222", "#443333", "#444444"],
    });
  });

  test("falls back to the documented palette values when unset", () => {
    expect(resolvePalette()).toEqual({
      sky: "#0b1220",
      ground: "#060a12",
      building: "#131c2a",
      windows: ["#1b2733", "#4a3b1e", "#8a6a22", "#d1a02e", "#ffd76a"],
    });
  });
});
