import { afterEach, describe, expect, spyOn, test } from "bun:test";
import handler from "../../api/contributions";
import { ALLOWED_ORIGIN } from "../../api/_lib/cors";
import { buildCalendarHtml } from "./fixture";

const originalFetch = globalThis.fetch;
const consoleErrors = spyOn(console, "error").mockImplementation(() => {});

afterEach(() => {
  globalThis.fetch = originalFetch;
  consoleErrors.mockClear();
});

interface UpstreamStub {
  status: number;
  body?: string;
  reject?: boolean;
}

function stubUpstream(...responses: UpstreamStub[]): { calls: () => number } {
  let call = 0;
  globalThis.fetch = (async () => {
    const stub = responses[Math.min(call, responses.length - 1)]!;
    call += 1;
    if (stub.reject) throw new DOMException("aborted", "AbortError");
    return new Response(stub.body ?? "", { status: stub.status });
  }) as unknown as typeof fetch;
  return { calls: () => call };
}

function request(query: string, method = "GET"): Request {
  return new Request(`https://proxy.test/api/contributions${query}`, { method });
}

async function readError(response: Response): Promise<{ code: string; message: string }> {
  expect(response.headers.get("Content-Type")).toBe("application/json");
  const body = (await response.json()) as { error: { code: string; message: string } };
  return body.error;
}

describe("GET /api/contributions", () => {
  test("returns 200 with the documented contract for a valid user", async () => {
    stubUpstream({ status: 200, body: buildCalendarHtml({ countFor: (index) => index % 5 }) });
    const response = await handler(request("?username=torvalds"));

    expect(response.status).toBe(200);
    const data = (await response.json()) as {
      username: string;
      totalContributions: number;
      weeks: { days: { date: string; count: number; level: number }[] }[];
    };
    expect(data.username).toBe("torvalds");
    expect(data.weeks).toHaveLength(53);
    expect(data.weeks.every((week) => week.days.length === 7)).toBe(true);
    expect(data.totalContributions).toBeGreaterThan(0);
  });

  test("returns 400 INVALID_USERNAME without contacting the upstream", async () => {
    const upstream = stubUpstream({ status: 200, body: buildCalendarHtml() });
    const response = await handler(request("?username=torv%40lds"));

    expect(response.status).toBe(400);
    expect((await readError(response)).code).toBe("INVALID_USERNAME");
    expect(upstream.calls()).toBe(0);
  });

  test("returns 400 INVALID_USERNAME when the query param is missing", async () => {
    const upstream = stubUpstream({ status: 200, body: buildCalendarHtml() });
    const response = await handler(request(""));

    expect(response.status).toBe(400);
    expect((await readError(response)).code).toBe("INVALID_USERNAME");
    expect(upstream.calls()).toBe(0);
  });

  test("returns 404 USER_NOT_FOUND without retrying", async () => {
    const upstream = stubUpstream({ status: 404 });
    const response = await handler(request("?username=nosuchuser"));

    expect(response.status).toBe(404);
    expect((await readError(response)).code).toBe("USER_NOT_FOUND");
    expect(upstream.calls()).toBe(1);
  });

  test("retries once on a 5xx and succeeds on the second attempt", async () => {
    const upstream = stubUpstream({ status: 500 }, { status: 200, body: buildCalendarHtml() });
    const response = await handler(request("?username=torvalds"));

    expect(response.status).toBe(200);
    expect(upstream.calls()).toBe(2);
  });

  test("returns 502 UPSTREAM_UNAVAILABLE after the retry is exhausted", async () => {
    const upstream = stubUpstream({ status: 500 });
    const response = await handler(request("?username=torvalds"));

    expect(response.status).toBe(502);
    expect((await readError(response)).code).toBe("UPSTREAM_UNAVAILABLE");
    expect(upstream.calls()).toBe(2);
  });

  test("returns 502 UPSTREAM_UNAVAILABLE when the upstream request times out twice", async () => {
    const upstream = stubUpstream({ status: 0, reject: true });
    const response = await handler(request("?username=torvalds"));

    expect(response.status).toBe(502);
    expect((await readError(response)).code).toBe("UPSTREAM_UNAVAILABLE");
    expect(upstream.calls()).toBe(2);
  });

  test("returns 422 PARSE_FAILED and logs the first 500 characters of the body", async () => {
    const body = `<html><body>${"unexpected markup ".repeat(60)}</body></html>`;
    stubUpstream({ status: 200, body });
    const response = await handler(request("?username=torvalds"));

    expect(response.status).toBe(422);
    expect((await readError(response)).code).toBe("PARSE_FAILED");
    const logged = consoleErrors.mock.calls.map((call) => String(call[0])).join("\n");
    expect(logged).toContain(body.slice(0, 500));
  });

  test("returns 422 PARSE_FAILED when the week count is not 53", async () => {
    stubUpstream({ status: 200, body: buildCalendarHtml({ weeks: 20 }) });
    const response = await handler(request("?username=torvalds"));

    expect(response.status).toBe(422);
    expect((await readError(response)).code).toBe("PARSE_FAILED");
  });

  test("answers the OPTIONS preflight with 204 and the CORS headers", async () => {
    const response = await handler(request("", "OPTIONS"));

    expect(response.status).toBe(204);
    expect(await response.text()).toBe("");
    expect(response.headers.get("Access-Control-Allow-Origin")).toBe(ALLOWED_ORIGIN);
    expect(response.headers.get("Access-Control-Allow-Methods")).toBe("GET");
  });

  test("every response carries the CORS headers and a JSON body, never HTML", async () => {
    const cases: UpstreamStub[][] = [
      [{ status: 200, body: buildCalendarHtml() }],
      [{ status: 404 }],
      [{ status: 500 }],
      [{ status: 200, body: "<html><body>broken</body></html>" }],
    ];
    for (const responses of cases) {
      stubUpstream(...responses);
      const response = await handler(request("?username=torvalds"));
      expect(response.headers.get("Access-Control-Allow-Origin")).toBe(ALLOWED_ORIGIN);
      expect(response.headers.get("Content-Type")).toBe("application/json");
      await expect(response.json()).resolves.toBeDefined();
    }

    stubUpstream({ status: 200, body: buildCalendarHtml() });
    const invalid = await handler(request("?username=-bad-"));
    expect(invalid.headers.get("Access-Control-Allow-Origin")).toBe(ALLOWED_ORIGIN);
    expect(invalid.headers.get("Content-Type")).toBe("application/json");
  });

  test("maps an unhandled exception to 502 UPSTREAM_UNAVAILABLE", async () => {
    const broken = { method: "GET", url: "not-a-valid-url" } as Request;
    const response = await handler(broken);

    expect(response.status).toBe(502);
    expect((await readError(response)).code).toBe("UPSTREAM_UNAVAILABLE");
  });
});
