import { describe, expect, test } from "bun:test";
import { ALLOWED_ORIGIN, buildPreflightResponse, withCorsHeaders } from "../../api/_lib/cors";

describe("cors", () => {
  test("attaches the allowed origin and methods to a success response", () => {
    const response = withCorsHeaders(new Response("{}", { status: 200 }));
    expect(response.headers.get("Access-Control-Allow-Origin")).toBe(ALLOWED_ORIGIN);
    expect(response.headers.get("Access-Control-Allow-Methods")).toBe("GET");
  });

  test("attaches the same headers to an error response", () => {
    const response = withCorsHeaders(new Response("{}", { status: 502 }));
    expect(response.headers.get("Access-Control-Allow-Origin")).toBe(ALLOWED_ORIGIN);
    expect(response.headers.get("Access-Control-Allow-Methods")).toBe("GET");
  });

  test("preflight answers 204 with an empty body", async () => {
    const response = buildPreflightResponse();
    expect(response.status).toBe(204);
    expect(await response.text()).toBe("");
    expect(response.headers.get("Access-Control-Allow-Origin")).toBe(ALLOWED_ORIGIN);
    expect(response.headers.get("Access-Control-Allow-Methods")).toBe("GET");
  });

  test("the allowed origin is the GitHub Pages origin", () => {
    expect(ALLOWED_ORIGIN).toMatch(/^https:\/\/[a-z0-9-]+\.github\.io$/);
  });
});
