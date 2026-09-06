import { afterEach, describe, expect, mock, test } from "bun:test";

import { PRODUCTION_API_BASE_URL } from "../../src/config";
import { fetchContributions } from "../../src/contributions/client";
import { ContributionFetchError } from "../../src/contributions/types";
import { buildModel } from "./fixture";

const originalFetch = globalThis.fetch;

afterEach(() => {
  globalThis.fetch = originalFetch;
});

function stubFetch(response: Response | (() => never)) {
  const spy = mock((_input: RequestInfo | URL, _init?: RequestInit) => {
    if (typeof response === "function") response();
    return Promise.resolve(response as Response);
  });
  globalThis.fetch = spy as unknown as typeof fetch;
  return spy;
}

function jsonResponse(status: number, body: unknown, headers: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(body), { status, headers });
}

async function expectCode(promise: Promise<unknown>, code: string): Promise<ContributionFetchError> {
  try {
    await promise;
  } catch (error) {
    expect(error).toBeInstanceOf(ContributionFetchError);
    expect((error as ContributionFetchError).code).toBe(code as never);
    return error as ContributionFetchError;
  }
  throw new Error(`expected rejection with ${code}`);
}

describe("fetchContributions", () => {
  test("builds the request against the production base url", async () => {
    const spy = stubFetch(jsonResponse(200, buildModel()));
    await fetchContributions("torvalds", new AbortController().signal);

    expect(String(spy.mock.calls[0]![0])).toBe(
      `${PRODUCTION_API_BASE_URL}/api/contributions?username=torvalds`,
    );
  });

  test("resolves the model on a 200 with 53 weeks", async () => {
    const model = buildModel({ username: "octocat", totalContributions: 1234 });
    stubFetch(jsonResponse(200, model));

    await expect(fetchContributions("octocat", new AbortController().signal)).resolves.toEqual(model);
  });

  test("accepts zero total contributions as success", async () => {
    stubFetch(jsonResponse(200, buildModel({ totalContributions: 0 })));

    const result = await fetchContributions("torvalds", new AbortController().signal);
    expect(result.totalContributions).toBe(0);
  });

  test("throws INVALID_RESPONSE on a wrong week count", async () => {
    const short = buildModel();
    short.weeks = short.weeks.slice(0, 52);
    stubFetch(jsonResponse(200, short));

    await expectCode(fetchContributions("torvalds", new AbortController().signal), "INVALID_RESPONSE");
  });

  test("throws INVALID_RESPONSE on a wrong day count", async () => {
    const model = buildModel();
    model.weeks[0]!.days = model.weeks[0]!.days.slice(0, 6);
    stubFetch(jsonResponse(200, model));

    await expectCode(fetchContributions("torvalds", new AbortController().signal), "INVALID_RESPONSE");
  });

  test("maps each proxy error code", async () => {
    const cases: Array<[number, string]> = [
      [400, "INVALID_USERNAME"],
      [404, "USER_NOT_FOUND"],
      [422, "PARSE_FAILED"],
      [502, "UPSTREAM_UNAVAILABLE"],
    ];
    for (const [status, code] of cases) {
      stubFetch(jsonResponse(status, { error: { code, message: "nope" } }));
      await expectCode(fetchContributions("torvalds", new AbortController().signal), code);
    }
  });

  test("reads retryAfterSeconds from the Retry-After header on 429", async () => {
    stubFetch(
      jsonResponse(429, { error: { code: "RATE_LIMITED", message: "slow down" } }, { "Retry-After": "180" }),
    );

    const error = await expectCode(
      fetchContributions("torvalds", new AbortController().signal),
      "RATE_LIMITED",
    );
    expect(error.retryAfterSeconds).toBe(180);
  });

  test("falls back to the default wait when Retry-After is unusable", async () => {
    stubFetch(jsonResponse(429, { error: { code: "RATE_LIMITED", message: "slow down" } }, { "Retry-After": "soon" }));

    const error = await expectCode(
      fetchContributions("torvalds", new AbortController().signal),
      "RATE_LIMITED",
    );
    expect(error.retryAfterSeconds).toBe(60);
  });

  test("maps an abort and a network failure to NETWORK_OR_TIMEOUT", async () => {
    stubFetch(() => {
      throw new DOMException("aborted", "AbortError");
    });
    await expectCode(fetchContributions("torvalds", new AbortController().signal), "NETWORK_OR_TIMEOUT");

    stubFetch(() => {
      throw new TypeError("Failed to fetch");
    });
    await expectCode(fetchContributions("torvalds", new AbortController().signal), "NETWORK_OR_TIMEOUT");
  });
});
