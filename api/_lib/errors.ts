import type { ErrorBody, ErrorCode } from "./types";

const STATUS_BY_CODE: Record<ErrorCode, number> = {
  INVALID_USERNAME: 400,
  USER_NOT_FOUND: 404,
  PARSE_FAILED: 422,
  RATE_LIMITED: 429,
  UPSTREAM_UNAVAILABLE: 502,
};

const MESSAGE_BY_CODE: Record<ErrorCode, string> = {
  INVALID_USERNAME: "The username does not match the allowed GitHub username pattern.",
  USER_NOT_FOUND: "No GitHub user found for the given username.",
  PARSE_FAILED: "The upstream contribution document could not be parsed.",
  RATE_LIMITED: "Too many requests. Try again later.",
  UPSTREAM_UNAVAILABLE: "GitHub is unavailable right now. Try again in a moment.",
};

export const PARSE_FAILURE_LOG_LENGTH = 500;

export function errorResponse(code: ErrorCode, message?: string): { status: number; body: ErrorBody } {
  return {
    status: STATUS_BY_CODE[code],
    body: { error: { code, message: message ?? MESSAGE_BY_CODE[code] } },
  };
}

export function logParseFailure(rawBody: string): void {
  console.error(`[contributions] parse failed; upstream body head: ${rawBody.slice(0, PARSE_FAILURE_LOG_LENGTH)}`);
}
