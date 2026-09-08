import { registerDom } from "../dom";

registerDom();

const { afterEach, beforeEach, describe, expect, mock, spyOn, test } = await import("bun:test");
const { exportBanner } = await import("../../src/downloads/export");
const { DOWNLOAD_PRESETS } = await import("../../src/downloads/presets");
const { DownloadError } = await import("../../src/downloads/errors");
import { buildModel } from "../contributions/fixture";

const X_PRESET = DOWNLOAD_PRESETS[0]!;
const LINKEDIN_PRESET = DOWNLOAD_PRESETS[1]!;

const OBJECT_URL = "blob:gitcitybanner/banner";

interface Harness {
  canvases: HTMLCanvasElement[];
  anchors: HTMLAnchorElement[];
  order: string[];
  restore: () => void;
}

function stubContext(): CanvasRenderingContext2D {
  return {
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
    fillText: () => {},
  } as unknown as CanvasRenderingContext2D;
}

function harness(
  toBlob: (canvas: HTMLCanvasElement, callback: BlobCallback) => void = (_canvas, callback) => {
    callback(new Blob(["png"], { type: "image/png" }));
  },
  onClick: () => void = () => {},
): Harness {
  const canvases: HTMLCanvasElement[] = [];
  const anchors: HTMLAnchorElement[] = [];
  const order: string[] = [];

  const getContext = spyOn(HTMLCanvasElement.prototype, "getContext").mockImplementation(function (
    this: HTMLCanvasElement,
  ) {
    return stubContext();
  } as unknown as HTMLCanvasElement["getContext"]);

  const toBlobSpy = spyOn(HTMLCanvasElement.prototype, "toBlob").mockImplementation(function (
    this: HTMLCanvasElement,
    callback: BlobCallback,
  ) {
    canvases.push(this);
    toBlob(this, callback);
  } as unknown as HTMLCanvasElement["toBlob"]);

  const clickSpy = spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(function (
    this: HTMLAnchorElement,
  ) {
    anchors.push(this);
    order.push("click");
    onClick();
  } as unknown as HTMLAnchorElement["click"]);

  const createUrl = spyOn(URL, "createObjectURL").mockImplementation(() => {
    order.push("create");
    return OBJECT_URL;
  });

  const revokeUrl = spyOn(URL, "revokeObjectURL").mockImplementation((url: string) => {
    order.push(`revoke:${url}`);
  });

  return {
    canvases,
    anchors,
    order,
    restore: () => {
      getContext.mockRestore();
      toBlobSpy.mockRestore();
      clickSpy.mockRestore();
      createUrl.mockRestore();
      revokeUrl.mockRestore();
    },
  };
}

describe("banner export", () => {
  let mounted: Harness | null = null;

  beforeEach(() => {
    document.documentElement.lang = "pt-BR";
    document.body.innerHTML = "";
  });

  afterEach(() => {
    mounted?.restore();
    mounted = null;
  });

  test("renders into a canvas that is never attached to the document", async () => {
    mounted = harness();
    await exportBanner(X_PRESET, buildModel(), "pt-BR");

    const canvas = mounted.canvases[0]!;
    expect(canvas.isConnected).toBe(false);
    expect(document.body.contains(canvas)).toBe(false);
    expect(document.querySelector("canvas")).toBeNull();
  });

  test("renders at the preset's exact dimensions", async () => {
    mounted = harness();
    await exportBanner(LINKEDIN_PRESET, buildModel(), "en");

    const canvas = mounted.canvases[0]!;
    expect({ width: canvas.width, height: canvas.height }).toEqual(LINKEDIN_PRESET.dimensions);

    await exportBanner(X_PRESET, buildModel(), "en");
    const xCanvas = mounted.canvases[1]!;
    expect({ width: xCanvas.width, height: xCanvas.height }).toEqual(X_PRESET.dimensions);
  });

  test("issues no network request", async () => {
    const fetchSpy = mock(() => Promise.reject(new Error("network call")));
    const originalFetch = globalThis.fetch;
    globalThis.fetch = fetchSpy as unknown as typeof fetch;
    mounted = harness();

    await exportBanner(X_PRESET, buildModel(), "pt-BR");

    expect(fetchSpy).not.toHaveBeenCalled();
    globalThis.fetch = originalFetch;
  });

  test("rejects with ENCODE_FAILED when toBlob yields no blob", async () => {
    mounted = harness((_canvas, callback) => callback(null));

    const failure = await exportBanner(X_PRESET, buildModel(), "pt-BR").catch(
      (error: unknown) => error,
    );
    expect(failure).toBeInstanceOf(DownloadError);
    expect((failure as InstanceType<typeof DownloadError>).code).toBe("ENCODE_FAILED");
  });

  test("rejects with ENCODE_FAILED when toBlob throws", async () => {
    mounted = harness(() => {
      throw new Error("encoder unavailable");
    });

    const failure = await exportBanner(X_PRESET, buildModel(), "pt-BR").catch(
      (error: unknown) => error,
    );
    expect((failure as InstanceType<typeof DownloadError>).code).toBe("ENCODE_FAILED");
  });

  test("rejects with DOWNLOAD_BLOCKED when the anchor click throws", async () => {
    mounted = harness(undefined, () => {
      throw new Error("blocked");
    });

    const failure = await exportBanner(X_PRESET, buildModel(), "pt-BR").catch(
      (error: unknown) => error,
    );
    expect(failure).toBeInstanceOf(DownloadError);
    expect((failure as InstanceType<typeof DownloadError>).code).toBe("DOWNLOAD_BLOCKED");
  });

  test("revokes the object URL after the click dispatches", async () => {
    mounted = harness();
    await exportBanner(X_PRESET, buildModel(), "pt-BR");

    expect(mounted.order).toEqual(["create", "click", `revoke:${OBJECT_URL}`]);
  });

  test("sets the preset filename and object URL on the anchor", async () => {
    mounted = harness();
    await exportBanner(LINKEDIN_PRESET, buildModel({ username: "Torvalds" }), "pt-BR");

    const anchor = mounted.anchors[0]!;
    expect(anchor.download).toBe("gitcitybanner-torvalds-linkedin.png");
    expect(anchor.getAttribute("href")).toBe(OBJECT_URL);
    expect(anchor.isConnected).toBe(false);
  });
});
