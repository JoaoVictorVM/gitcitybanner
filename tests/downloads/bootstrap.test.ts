import { registerDom } from "../dom";

registerDom();

const { afterEach, beforeEach, describe, expect, mock, spyOn, test } = await import("bun:test");
const { mountDownloadButtons } = await import("../../src/downloads/bootstrap");
const { mountContributionRetrieval } = await import("../../src/contributions/bootstrap");
const { clearContributionModel, setContributionModel } = await import(
  "../../src/contributions/session"
);
import type { Shell } from "../../src/app";
import { buildModel } from "../contributions/fixture";

const SHELL_MARKUP =
  '<div id="app"></div><section id="preview" class="preview">' +
  '<p class="preview__hint"></p>' +
  '<canvas class="preview__canvas" width="1500" height="500" hidden></canvas>' +
  '<div id="downloads" class="preview__actions" hidden></div>' +
  "</section>";

const flush = (): Promise<void> => new Promise<void>((resolve) => setTimeout(resolve, 0));

const originalFetch = globalThis.fetch;

function buildShell(): Shell {
  document.documentElement.lang = "pt-BR";
  document.body.innerHTML = SHELL_MARKUP;
  return {
    root: document.getElementById("app")!,
    preview: document.getElementById("preview")!,
    downloads: document.getElementById("downloads")!,
  };
}

describe("download buttons bootstrap", () => {
  let shell: Shell;

  beforeEach(() => {
    shell = buildShell();
  });

  afterEach(() => {
    clearContributionModel();
    globalThis.fetch = originalFetch;
  });

  test("mounts both buttons hidden into the downloads container", () => {
    mountDownloadButtons(shell);

    expect(shell.downloads.querySelectorAll("button")).toHaveLength(2);
    expect(shell.downloads.hidden).toBe(true);
  });

  test("onBannerReady reveals and enables both buttons", () => {
    const mount = mountDownloadButtons(shell);
    const model = buildModel();
    setContributionModel(model);

    mount.onBannerReady(model);

    expect(shell.downloads.hidden).toBe(false);
    for (const button of shell.downloads.querySelectorAll("button")) {
      expect(button.disabled).toBe(false);
    }
  });

  test("onBannerReady stays idempotent across regenerations", () => {
    const mount = mountDownloadButtons(shell);
    const model = buildModel();

    mount.onBannerReady(model);
    mount.onBannerReady(buildModel({ username: "octocat" }));

    expect(shell.downloads.querySelectorAll("button")).toHaveLength(2);
    expect(shell.downloads.hidden).toBe(false);
  });

  test("a successful generation reveals the buttons through the retrieval wiring", async () => {
    const canvas = shell.preview.querySelector<HTMLCanvasElement>(".preview__canvas")!;
    spyOn(canvas, "getContext").mockReturnValue({
      fillStyle: "",
      font: "",
      textAlign: "start",
      textBaseline: "alphabetic",
      fillRect: () => {},
      fillText: () => {},
    } as unknown as CanvasRenderingContext2D);

    const model = buildModel();
    globalThis.fetch = mock(() =>
      Promise.resolve(new Response(JSON.stringify(model), { status: 200 })),
    ) as unknown as typeof fetch;

    const mount = mountDownloadButtons(shell);
    mountContributionRetrieval(shell, mount.onBannerReady);

    const input = shell.root.querySelector<HTMLInputElement>("input")!;
    input.value = model.username;
    input.dispatchEvent(new Event("input", { bubbles: true }));
    shell.root.querySelector("form")!.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));

    await flush();

    expect(shell.downloads.hidden).toBe(false);
    for (const button of shell.downloads.querySelectorAll("button")) {
      expect(button.disabled).toBe(false);
    }
  });
});
