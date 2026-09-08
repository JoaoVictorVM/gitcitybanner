import { registerDom } from "../dom";

registerDom();

const { beforeEach, describe, expect, spyOn, test } = await import("bun:test");
const { renderPreview, PREVIEW_DIMENSIONS } = await import("../../src/contributions/preview");
import type { Shell } from "../../src/app";
import type { Locale } from "../../src/i18n/translations";
import { buildModel } from "./fixture";

interface Harness {
  shell: Shell;
  canvas: HTMLCanvasElement;
  actions: HTMLElement;
  hint: HTMLElement;
  texts: string[];
}

const PREVIEW_MARKUP = `
  <p class="preview__hint">O banner aparece aqui depois que você gerar.</p>
  <canvas class="preview__canvas" width="1500" height="500" hidden></canvas>
  <div id="downloads" class="preview__actions" hidden></div>
`;

function stubContext(canvas: HTMLCanvasElement, texts: string[]): void {
  const context = {
    fillStyle: "",
    font: "",
    textAlign: "start",
    textBaseline: "alphabetic",
    fillRect: () => {},
    beginPath: () => {},
    moveTo: () => {},
    lineTo: () => {},
    closePath: () => {},
    fill: () => {},
    fillText: (text: string) => {
      texts.push(text);
    },
  };
  spyOn(canvas, "getContext").mockReturnValue(context as unknown as CanvasRenderingContext2D);
}

function harness(locale: Locale = "pt-BR", markup: string = PREVIEW_MARKUP): Harness {
  document.documentElement.lang = locale;
  document.body.innerHTML = `<div id="app"></div><section id="preview" class="preview">${markup}</section>`;
  const preview = document.getElementById("preview")!;
  const canvas = preview.querySelector<HTMLCanvasElement>(".preview__canvas")!;
  const texts: string[] = [];
  if (canvas) stubContext(canvas, texts);

  return {
    shell: {
      root: document.getElementById("app")!,
      preview,
      downloads: preview.querySelector<HTMLElement>(".preview__actions") ?? preview,
    },
    canvas,
    actions: preview.querySelector<HTMLElement>(".preview__actions")!,
    hint: preview.querySelector<HTMLElement>(".preview__hint")!,
    texts,
  };
}

describe("preview rendering", () => {
  let mounted: Harness;

  beforeEach(() => {
    mounted = harness();
  });

  test("throws when the canvas element is missing", () => {
    const broken = harness("pt-BR", `<p class="preview__hint">vazio</p>`);
    expect(() => renderPreview(broken.shell, buildModel(), "pt-BR")).toThrow();
  });

  test("throws when the actions slot is missing", () => {
    const broken = harness(
      "pt-BR",
      `<canvas class="preview__canvas" width="1500" height="500" hidden></canvas>`,
    );
    expect(() => renderPreview(broken.shell, buildModel(), "pt-BR")).toThrow();
  });

  test("renders the banner into the preview canvas at the preview dimensions", () => {
    renderPreview(mounted.shell, buildModel({ totalContributions: 1234 }), "pt-BR");

    expect(PREVIEW_DIMENSIONS).toEqual({ width: 1500, height: 500 });
    expect(mounted.canvas.width).toBe(1500);
    expect(mounted.canvas.height).toBe(500);
    expect(mounted.texts).toContain("@torvalds · 1.234 contribuições");
  });

  test("renders the banner in the requested locale", () => {
    renderPreview(mounted.shell, buildModel({ totalContributions: 1234 }), "en");

    expect(mounted.texts).toContain("@torvalds · 1,234 contributions");
  });

  test("sets the accessible description in pt-BR", () => {
    renderPreview(mounted.shell, buildModel({ totalContributions: 1234 }), "pt-BR");

    expect(mounted.canvas.getAttribute("role")).toBe("img");
    expect(mounted.canvas.getAttribute("aria-label")).toBe(
      "Banner da cidade de @torvalds com 1.234 contribuições",
    );
  });

  test("sets the accessible description in English", () => {
    renderPreview(mounted.shell, buildModel({ totalContributions: 1234 }), "en");

    expect(mounted.canvas.getAttribute("aria-label")).toBe(
      "City banner for @torvalds with 1,234 contributions",
    );
  });

  test("names a zero count in the accessible description", () => {
    renderPreview(mounted.shell, buildModel({ totalContributions: 0 }), "pt-BR");

    expect(mounted.canvas.getAttribute("aria-label")).toBe(
      "Banner da cidade de @torvalds com 0 contribuições",
    );
  });

  test("reveals the canvas and the actions slot and hides the hint", () => {
    expect(mounted.canvas.hidden).toBe(true);
    expect(mounted.actions.hidden).toBe(true);

    renderPreview(mounted.shell, buildModel(), "pt-BR");

    expect(mounted.shell.preview.classList.contains("preview--filled")).toBe(true);
    expect(mounted.canvas.hidden).toBe(false);
    expect(mounted.actions.hidden).toBe(false);
    expect(mounted.hint.hidden).toBe(true);
  });

  test("replaces a prior render in place", () => {
    renderPreview(mounted.shell, buildModel({ totalContributions: 1234 }), "pt-BR");
    renderPreview(
      mounted.shell,
      buildModel({ username: "gaearon", totalContributions: 42 }),
      "pt-BR",
    );

    expect(mounted.shell.preview.querySelectorAll(".preview__canvas")).toHaveLength(1);
    expect(mounted.shell.preview.querySelector(".preview__canvas")).toBe(mounted.canvas);
    expect(mounted.texts).toContain("@torvalds · 1.234 contribuições");
    expect(mounted.texts).toContain("@gaearon · 42 contribuições");
    expect(mounted.canvas.getAttribute("aria-label")).toBe(
      "Banner da cidade de @gaearon com 42 contribuições",
    );
  });
});
