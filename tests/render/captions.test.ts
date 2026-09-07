import { describe, expect, test } from "bun:test";

import type { CanvasDimensions } from "../../src/layout/types";
import { formatCaptionText, formatFooterText } from "../../src/render/captions";
import { RENDER_CONSTANTS, resolveRenderConstants } from "../../src/render/constants";

const X_CANVAS: CanvasDimensions = { width: 1500, height: 500 };
const LINKEDIN_CANVAS: CanvasDimensions = { width: 1584, height: 396 };

describe("formatCaptionText", () => {
  test("formats pt-BR with a dot thousands separator", () => {
    expect(formatCaptionText("torvalds", 12345, "pt-BR")).toBe("@torvalds · 12.345 contribuições");
  });

  test("formats en with a comma thousands separator", () => {
    expect(formatCaptionText("torvalds", 12345, "en")).toBe("@torvalds · 12,345 contributions");
  });

  test("keeps a zero count in the caption", () => {
    expect(formatCaptionText("torvalds", 0, "pt-BR")).toBe("@torvalds · 0 contribuições");
  });
});

describe("formatFooterText", () => {
  test("points at the deployed site domain", () => {
    expect(formatFooterText()).toBe("joaovictorvm.github.io/gitcitybanner");
  });
});

describe("resolveRenderConstants", () => {
  test("scales the LinkedIn font sizes by 0.9 and rounds", () => {
    const base = RENDER_CONSTANTS["1500x500"]!;
    const linkedin = resolveRenderConstants(LINKEDIN_CANVAS);
    expect(linkedin.captionFontSize).toBe(Math.round(base.captionFontSize * 0.9));
    expect(linkedin.footerFontSize).toBe(Math.round(base.footerFontSize * 0.9));
  });

  test("returns the documented X offsets", () => {
    const x = resolveRenderConstants(X_CANVAS);
    expect(x.captionOffset).toEqual({ left: 40, top: 44 });
    expect(x.footerOffset).toEqual({ right: 40, bottom: 36 });
  });

  test("throws on an unrecognized canvas size", () => {
    expect(() => resolveRenderConstants({ width: 800, height: 600 })).toThrow();
  });
});
