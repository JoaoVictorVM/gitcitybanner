import { CACHE_CONTROL_ERROR, CACHE_CONTROL_SUCCESS, getCached, setCached } from "./_lib/cache";
import { extractClientIp } from "./_lib/clientIp";
import { buildPreflightResponse, withCorsHeaders } from "./_lib/cors";
import { errorResponse, logParseFailure } from "./_lib/errors";
import { fetchContributionsSvg } from "./_lib/github";
import { ParseError, parseContributionsSvg } from "./_lib/parse";
import { checkAndRecord } from "./_lib/rateLimit";
import type { ContributionData, ErrorCode } from "./_lib/types";
import { isValidUsername } from "./_lib/validate";

function jsonResponse(status: number, body: unknown, headers: Record<string, string>): Response {
  return withCorsHeaders(
    new Response(JSON.stringify(body), {
      status,
      headers: { "Content-Type": "application/json", ...headers },
    }),
  );
}

function succeed(data: ContributionData): Response {
  return jsonResponse(200, data, { "Cache-Control": CACHE_CONTROL_SUCCESS });
}

function fail(code: ErrorCode, headers: Record<string, string> = {}): Response {
  const { status, body } = errorResponse(code);
  return jsonResponse(status, body, { "Cache-Control": CACHE_CONTROL_ERROR, ...headers });
}

export default async function handler(request: Request): Promise<Response> {
  if (request.method === "OPTIONS") return buildPreflightResponse();

  try {
    const username = new URL(request.url).searchParams.get("username") ?? "";
    if (!isValidUsername(username)) return fail("INVALID_USERNAME");

    const cached = getCached(username);
    if (cached) return succeed(cached);

    const verdict = checkAndRecord(extractClientIp(request));
    if (!verdict.allowed) {
      return fail("RATE_LIMITED", { "Retry-After": String(verdict.retryAfterSeconds) });
    }

    const upstream = await fetchContributionsSvg(username);
    if (upstream.status === 404) return fail("USER_NOT_FOUND");
    if (upstream.status !== 200) return fail("UPSTREAM_UNAVAILABLE");

    try {
      const data = parseContributionsSvg(upstream.body, username);
      setCached(username, data);
      return succeed(data);
    } catch (error) {
      if (!(error instanceof ParseError)) throw error;
      logParseFailure(upstream.body);
      return fail("PARSE_FAILED");
    }
  } catch (error) {
    console.error("[contributions] unhandled error", error);
    return fail("UPSTREAM_UNAVAILABLE");
  }
}
