import { registerDom } from "./dom";

registerDom();

const { describe, expect, test, beforeEach, mock } = await import("bun:test");
const { mountUsernameForm } = await import("../src/username-form");
const { translations } = await import("../src/i18n/translations");
import type { Locale } from "../src/i18n/translations";
import type { Shell } from "../src/app";

interface Mounted {
  form: HTMLFormElement;
  input: HTMLInputElement;
  button: HTMLButtonElement;
  error: HTMLParagraphElement;
  onValidUsername: ReturnType<typeof mock>;
}

function mount(locale: Locale = "pt-BR"): Mounted {
  document.documentElement.lang = locale;
  document.body.innerHTML = `<div id="app"></div><section id="preview"></section>`;
  const shell: Shell = {
    root: document.getElementById("app")!,
    preview: document.getElementById("preview")!,
  };
  const onValidUsername = mock(() => {});
  const form = mountUsernameForm(shell, onValidUsername);
  return {
    form,
    input: form.querySelector("input")!,
    button: form.querySelector("button")!,
    error: form.querySelector(".username-form__error")!,
    onValidUsername,
  };
}

function type(input: HTMLInputElement, value: string): void {
  input.value = value;
  input.dispatchEvent(new Event("input", { bubbles: true }));
}

function pressEnter(input: HTMLInputElement): void {
  input.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true, cancelable: true }));
}

beforeEach(() => {
  document.body.innerHTML = "";
});

describe("username form", () => {
  test("button is disabled while the field is empty", () => {
    const { button } = mount();
    expect(button.disabled).toBe(true);
  });

  test("button is enabled from the first character", () => {
    const { input, button } = mount();
    type(input, "t");
    expect(button.disabled).toBe(false);
    type(input, "");
    expect(button.disabled).toBe(true);
  });

  test("the field is focused on mount", () => {
    const { input } = mount();
    expect(document.activeElement).toBe(input);
  });

  test("pressing Enter submits like a button click", () => {
    const { input, button, onValidUsername } = mount();
    type(input, "torvalds");
    pressEnter(input);
    expect(onValidUsername).toHaveBeenCalledWith("torvalds");

    button.click();
    expect(onValidUsername).toHaveBeenCalledTimes(2);
    expect(onValidUsername.mock.calls).toEqual([["torvalds"], ["torvalds"]]);
  });

  test("an invalid submit shows the error, marks the field, and calls nothing", () => {
    const { input, button, error, onValidUsername } = mount();
    type(input, "torv@lds");
    button.click();

    expect(error.textContent).toBe(translations["pt-BR"].invalidUsernameMessage);
    expect(input.getAttribute("aria-invalid")).toBe("true");
    expect(document.activeElement).toBe(input);
    expect(onValidUsername).not.toHaveBeenCalled();
  });

  test("a leading or trailing hyphen is rejected", () => {
    for (const value of ["-torvalds", "torvalds-"]) {
      const { input, button, error, onValidUsername } = mount();
      type(input, value);
      button.click();
      expect(error.textContent, value).toBe(translations["pt-BR"].invalidUsernameMessage);
      expect(onValidUsername).not.toHaveBeenCalled();
    }
  });

  test("the error clears on the next keystroke", () => {
    const { input, button, error } = mount();
    type(input, "torv@lds");
    button.click();
    expect(error.textContent).not.toBe("");

    type(input, "torv@ld");
    expect(error.textContent).toBe("");
    expect(input.hasAttribute("aria-invalid")).toBe(false);
  });

  test("a valid submit clears a prior error", () => {
    const { input, button, error, onValidUsername } = mount();
    type(input, "torv@lds");
    button.click();

    input.value = "torvalds";
    button.click();
    expect(error.textContent).toBe("");
    expect(input.hasAttribute("aria-invalid")).toBe(false);
    expect(onValidUsername).toHaveBeenCalledTimes(1);
    expect(onValidUsername).toHaveBeenCalledWith("torvalds");
  });

  test("pasted profile URLs and @handles normalize before submitting", () => {
    for (const value of ["https://github.com/torvalds", "github.com/torvalds/", "@torvalds", "  torvalds "]) {
      const { input, button, onValidUsername } = mount();
      type(input, value);
      button.click();
      expect(onValidUsername, value).toHaveBeenCalledWith("torvalds");
    }
  });

  test("renders every string from the active locale on both pages", () => {
    for (const locale of ["pt-BR", "en"] as const) {
      const { form, input, button, error } = mount(locale);
      const strings = translations[locale];
      expect(form.querySelector("label")!.textContent, locale).toBe(strings.usernameLabel);
      expect(input.placeholder, locale).toBe(strings.usernamePlaceholder);
      expect(input.maxLength, locale).toBe(39);
      expect(button.textContent, locale).toBe(strings.generateButtonLabel);

      type(input, "torv@lds");
      button.click();
      expect(error.textContent, locale).toBe(strings.invalidUsernameMessage);
    }
  });
});
