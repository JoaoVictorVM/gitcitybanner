import { registerDom } from "../dom";

registerDom();

const { afterEach, beforeEach, describe, expect, mock, test } = await import("bun:test");
const { mountUsernameForm } = await import("../../src/username-form");
const { attachFormControls } = await import("../../src/contributions/form-controls");
const { createContributionController } = await import("../../src/contributions/controller");
const { mountContributionRetrieval } = await import("../../src/contributions/bootstrap");
const { clearContributionModel, getContributionModel } = await import("../../src/contributions/session");
const { translations } = await import("../../src/i18n/translations");
import type { Shell } from "../../src/app";
import type { ContributionModel } from "../../src/contributions/types";
import { buildModel } from "./fixture";

const originalFetch = globalThis.fetch;
const SHELL_MARKUP = '<div id="app"></div><section id="preview" class="preview"></section>';

interface Harness {
  shell: Shell;
  input: HTMLInputElement;
  button: HTMLButtonElement;
  error: HTMLElement;
  submit: (username: string) => void;
  onResult: ReturnType<typeof mock>;
}

function buildShell(locale: "pt-BR" | "en"): Shell {
  document.documentElement.lang = locale;
  document.body.innerHTML = SHELL_MARKUP;
  return {
    root: document.getElementById("app")!,
    preview: document.getElementById("preview")!,
  };
}

function harness(locale: "pt-BR" | "en" = "pt-BR"): Harness {
  const shell = buildShell(locale);
  const form = mountUsernameForm(shell, () => {});
  const onResult = mock((_model: ContributionModel) => {});
  const controller = createContributionController(shell, attachFormControls(form), onResult);
  return {
    shell,
    input: form.querySelector("input")!,
    button: form.querySelector("button")!,
    error: form.querySelector(".username-form__error")!,
    submit: controller.handleUsernameSubmit,
    onResult,
  };
}

function respondWith(status: number, body: unknown, headers: Record<string, string> = {}) {
  const spy = mock((_input: RequestInfo | URL, _init?: RequestInit) =>
    Promise.resolve(new Response(JSON.stringify(body), { status, headers })),
  );
  globalThis.fetch = spy as unknown as typeof fetch;
  return spy;
}

function deferredFetch() {
  const signals: AbortSignal[] = [];
  const resolvers: Array<(response: Response) => void> = [];
  const spy = mock((_input: RequestInfo | URL, init?: RequestInit) => {
    if (init?.signal) signals.push(init.signal);
    return new Promise<Response>((resolve) => resolvers.push(resolve));
  });
  globalThis.fetch = spy as unknown as typeof fetch;
  return { signals, resolvers, spy };
}

function okResponse(model: ContributionModel): Response {
  return new Response(JSON.stringify(model), { status: 200 });
}

const flush = () => new Promise<void>((resolve) => setTimeout(resolve, 0));

beforeEach(() => {
  clearContributionModel();
});

afterEach(() => {
  globalThis.fetch = originalFetch;
});

describe("contribution controller", () => {
  test("shows the pending state on the button and the preview while in flight", async () => {
    const { shell, button, submit } = harness();
    const { resolvers } = deferredFetch();

    submit("torvalds");
    expect(button.disabled).toBe(true);
    expect(button.classList.contains("username-form__button--pending")).toBe(true);
    expect(shell.preview.classList.contains("preview--pending")).toBe(true);

    resolvers[0]!(okResponse(buildModel()));
    await flush();

    expect(shell.preview.classList.contains("preview--pending")).toBe(false);
    expect(button.classList.contains("username-form__button--pending")).toBe(false);
  });

  test("stores the model and invokes onResult on success", async () => {
    const model = buildModel({ username: "octocat", totalContributions: 1234 });
    respondWith(200, model);
    const { onResult, submit } = harness();

    submit("octocat");
    await flush();

    expect(getContributionModel()).toEqual(model);
    expect(onResult).toHaveBeenCalledTimes(1);
    expect(onResult.mock.calls[0]![0]).toEqual(model);
  });

  test("treats zero contributions as success", async () => {
    respondWith(200, buildModel({ totalContributions: 0 }));
    const { error, onResult, submit } = harness();

    submit("torvalds");
    await flush();

    expect(onResult).toHaveBeenCalledTimes(1);
    expect(error.textContent).toBe("");
  });

  test("shows the user-not-found message and returns to the idle state", async () => {
    respondWith(404, { error: { code: "USER_NOT_FOUND", message: "nope" } });
    const { button, error, input, shell, submit } = harness();
    input.value = "ghost";

    submit("ghost");
    await flush();

    expect(error.textContent).toBe(translations["pt-BR"].errorUserNotFound);
    expect(button.disabled).toBe(false);
    expect(shell.preview.classList.contains("preview--pending")).toBe(false);
    expect(getContributionModel()).toBeNull();
  });

  test("shows the rate-limit message with the wait in minutes", async () => {
    respondWith(429, { error: { code: "RATE_LIMITED", message: "slow" } }, { "Retry-After": "150" });
    const { error, submit } = harness("en");

    submit("torvalds");
    await flush();

    expect(error.textContent).toBe("Too many generations in a short time. Try again in 3 minutes.");
  });

  test("shows the service-unavailable message for 422 and 502, distinct from user-not-found", async () => {
    for (const [status, code] of [
      [422, "PARSE_FAILED"],
      [502, "UPSTREAM_UNAVAILABLE"],
    ] as const) {
      respondWith(status, { error: { code, message: "boom" } });
      const { error, submit } = harness();
      submit("torvalds");
      await flush();

      expect(error.textContent).toBe(translations["pt-BR"].errorServiceUnavailable);
      expect(error.textContent).not.toBe(translations["pt-BR"].errorUserNotFound);
    }
  });

  test("shows the connection-failed message on a network error", async () => {
    globalThis.fetch = mock(() => Promise.reject(new TypeError("Failed to fetch"))) as unknown as typeof fetch;
    const { error, submit } = harness();

    submit("torvalds");
    await flush();

    expect(error.textContent).toBe(translations["pt-BR"].errorConnectionFailed);
  });

  test("aborts the previous request and keeps only the second result", async () => {
    const { signals, resolvers } = deferredFetch();
    const { onResult, submit } = harness();

    submit("torvalds");
    submit("octocat");

    expect(signals[0]!.aborted).toBe(true);
    expect(signals[1]!.aborted).toBe(false);

    resolvers[1]!(okResponse(buildModel({ username: "octocat", totalContributions: 7 })));
    resolvers[0]!(okResponse(buildModel({ username: "torvalds" })));
    await flush();

    expect(onResult).toHaveBeenCalledTimes(1);
    expect(getContributionModel()?.username).toBe("octocat");
  });

  test("replaces the stored model on a second generation without a reload", async () => {
    respondWith(200, buildModel({ username: "torvalds", totalContributions: 1 }));
    const { submit } = harness();
    submit("torvalds");
    await flush();
    expect(getContributionModel()?.username).toBe("torvalds");

    respondWith(200, buildModel({ username: "octocat", totalContributions: 2 }));
    submit("octocat");
    await flush();
    expect(getContributionModel()?.username).toBe("octocat");
  });

  test("reading the stored model issues no further requests", async () => {
    const spy = respondWith(200, buildModel());
    const { submit } = harness();
    submit("torvalds");
    await flush();

    getContributionModel();
    getContributionModel();

    expect(spy).toHaveBeenCalledTimes(1);
  });
});

describe("bootstrap wiring", () => {
  test("a username submitted through the form reaches the proxy and is stored intact", async () => {
    const model = buildModel({ username: "torvalds", totalContributions: 4321 });
    const spy = respondWith(200, model);

    const shell = buildShell("pt-BR");
    mountContributionRetrieval(shell);

    const form = document.querySelector<HTMLFormElement>(".username-form")!;
    const input = form.querySelector("input")!;
    input.value = "  @Torvalds ";
    input.dispatchEvent(new Event("input", { bubbles: true }));
    form.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
    await flush();

    expect(String(spy.mock.calls[0]![0])).toContain("username=Torvalds");
    const stored = getContributionModel();
    expect(stored).toEqual(model);
    expect(stored?.weeks).toHaveLength(53);
  });
});
