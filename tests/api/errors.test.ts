import { describe, expect, spyOn, test } from "bun:test";
import { errorResponse, logParseFailure, PARSE_FAILURE_LOG_LENGTH } from "../../api/_lib/errors";
import { ERROR_CODES } from "../../api/_lib/types";

describe("errorResponse", () => {
  test("maps each code to its documented status", () => {
    expect(errorResponse("INVALID_USERNAME").status).toBe(400);
    expect(errorResponse("USER_NOT_FOUND").status).toBe(404);
    expect(errorResponse("PARSE_FAILED").status).toBe(422);
    expect(errorResponse("RATE_LIMITED").status).toBe(429);
    expect(errorResponse("UPSTREAM_UNAVAILABLE").status).toBe(502);
  });

  test("every code yields the shared error body shape with a message", () => {
    for (const code of ERROR_CODES) {
      const { body } = errorResponse(code);
      expect(body.error.code).toBe(code);
      expect(body.error.message.trim()).not.toBe("");
    }
  });

  test("accepts an explicit message override", () => {
    expect(errorResponse("PARSE_FAILED", "custom").body.error.message).toBe("custom");
  });
});

describe("logParseFailure", () => {
  test("logs at most the first 500 characters of the upstream body", () => {
    const spy = spyOn(console, "error").mockImplementation(() => {});
    logParseFailure("x".repeat(2000));
    const logged = String(spy.mock.calls[0]?.[0] ?? "");
    spy.mockRestore();
    expect(logged).toContain("x".repeat(PARSE_FAILURE_LOG_LENGTH));
    expect(logged).not.toContain("x".repeat(PARSE_FAILURE_LOG_LENGTH + 1));
  });
});
