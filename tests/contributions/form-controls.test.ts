import { registerDom } from "../dom";

registerDom();

const { beforeEach, describe, expect, test } = await import("bun:test");
const { mountUsernameForm } = await import("../../src/username-form");
const { attachFormControls } = await import("../../src/contributions/form-controls");
import type { Shell } from "../../src/app";

interface Mounted {
  input: HTMLInputElement;
  button: HTMLButtonElement;
  error: HTMLElement;
  controls: ReturnType<typeof attachFormControls>;
}

function mount(): Mounted {
  document.documentElement.lang = "pt-BR";
  document.body.innerHTML = `<div id="app"></div><section id="preview"></section>`;
  const shell: Shell = {
    root: document.getElementById("app")!,
    preview: document.getElementById("preview")!,
  };
  const form = mountUsernameForm(shell, () => {});
  return {
    input: form.querySelector("input")!,
    button: form.querySelector("button")!,
    error: form.querySelector(".username-form__error")!,
    controls: attachFormControls(form),
  };
}

function type(input: HTMLInputElement, value: string): void {
  input.value = value;
  input.dispatchEvent(new Event("input", { bubbles: true }));
}

describe("form controls", () => {
  let mounted: Mounted;

  beforeEach(() => {
    mounted = mount();
  });

  test("pending disables the button and survives a keystroke", () => {
    type(mounted.input, "torvalds");
    expect(mounted.button.disabled).toBe(false);

    mounted.controls.setPending(true);
    expect(mounted.button.disabled).toBe(true);
    expect(mounted.button.getAttribute("aria-busy")).toBe("true");
    expect(mounted.button.classList.contains("username-form__button--pending")).toBe(true);

    type(mounted.input, "octocat");
    expect(mounted.button.disabled).toBe(true);
  });

  test("keeps the input editable while pending", () => {
    mounted.controls.setPending(true);
    expect(mounted.input.disabled).toBe(false);
    expect(mounted.input.readOnly).toBe(false);
  });

  test("leaving pending restores the form's own enabled rule", () => {
    type(mounted.input, "torvalds");
    mounted.controls.setPending(true);
    mounted.controls.setPending(false);
    expect(mounted.button.disabled).toBe(false);
    expect(mounted.button.hasAttribute("aria-busy")).toBe(false);
    expect(mounted.button.classList.contains("username-form__button--pending")).toBe(false);

    type(mounted.input, "");
    mounted.controls.setPending(true);
    mounted.controls.setPending(false);
    expect(mounted.button.disabled).toBe(true);
  });

  test("shows and clears the remote error without touching aria-invalid", () => {
    mounted.input.setAttribute("aria-invalid", "true");

    mounted.controls.showRemoteError("falhou");
    expect(mounted.error.textContent).toBe("falhou");
    expect(mounted.input.getAttribute("aria-invalid")).toBe("true");

    mounted.controls.clearRemoteError();
    expect(mounted.error.textContent).toBe("");
    expect(mounted.input.getAttribute("aria-invalid")).toBe("true");
  });

  test("throws when the form is missing its expected elements", () => {
    const bare = document.createElement("form");
    expect(() => attachFormControls(bare)).toThrow();
  });
});
