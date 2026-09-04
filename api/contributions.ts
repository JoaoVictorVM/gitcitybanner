import { buildPreflightResponse, withCorsHeaders } from "./_lib/cors";
import { errorResponse, logParseFailure } from "./_lib/errors";
import { fetchContributionsSvg } from "./_lib/github";
import { ParseError, parseContributionsSvg } from "./_lib/parse";
import type { ErrorCode } from "./_lib/types";
import { isValidUsername } from "./_lib/validate";

function jsonResponse(status: number, body: unknown): Response {
  return withCorsHeaders(
    new Response(JSON.stringify(body), {
      status,
      headers: { "Content-Type": "application/json" },
    }),
  );
}

function fail(code: ErrorCode): Response {
  const { status, body } = errorResponse(code);
  return jsonResponse(status, body);
}

export default async function handler(request: Request): Promise<Response> {
  if (request.method === "OPTIONS") return buildPreflightResponse();

  try {
    const username = new URL(request.url).searchParams.get("username") ?? "";
    if (!isValidUsername(username)) return fail("INVALID_USERNAME");

    const upstream = await fetchContributionsSvg(username);
    if (upstream.status === 404) return fail("USER_NOT_FOUND");
    if (upstream.status !== 200) return fail("UPSTREAM_UNAVAILABLE");

    try {
      return jsonResponse(200, parseContributionsSvg(upstream.body, username));
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
