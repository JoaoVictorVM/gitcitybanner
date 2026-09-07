import { spyOn } from "bun:test";

export interface DrawCall {
  method: "fillRect" | "fillText" | "strokeRect" | "drawImage" | "arc";
  args: unknown[];
  fillStyle: string;
  font: string;
  textAlign: string;
  textBaseline: string;
}

export interface RecordingCanvas {
  canvas: HTMLCanvasElement;
  calls: DrawCall[];
}

export function createRecordingCanvas(): RecordingCanvas {
  const calls: DrawCall[] = [];
  const state = { fillStyle: "", font: "", textAlign: "start", textBaseline: "alphabetic" };

  const record =
    (method: DrawCall["method"]) =>
    (...args: unknown[]): void => {
      calls.push({ method, args, ...state });
    };

  const context = {
    get fillStyle() {
      return state.fillStyle;
    },
    set fillStyle(value: string) {
      state.fillStyle = value;
    },
    get font() {
      return state.font;
    },
    set font(value: string) {
      state.font = value;
    },
    get textAlign() {
      return state.textAlign;
    },
    set textAlign(value: string) {
      state.textAlign = value;
    },
    get textBaseline() {
      return state.textBaseline;
    },
    set textBaseline(value: string) {
      state.textBaseline = value;
    },
    fillRect: record("fillRect"),
    fillText: record("fillText"),
    strokeRect: record("strokeRect"),
    drawImage: record("drawImage"),
    arc: record("arc"),
  };

  const canvas = document.createElement("canvas");
  spyOn(canvas, "getContext").mockReturnValue(context as unknown as CanvasRenderingContext2D);

  return { canvas, calls };
}
