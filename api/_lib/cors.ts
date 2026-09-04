export const ALLOWED_ORIGIN = "https://joaovictorvm.github.io";

export const CORS_HEADERS: Record<string, string> = {
  "Access-Control-Allow-Origin": ALLOWED_ORIGIN,
  "Access-Control-Allow-Methods": "GET",
};

export function withCorsHeaders(response: Response): Response {
  for (const [name, value] of Object.entries(CORS_HEADERS)) {
    response.headers.set(name, value);
  }
  return response;
}

export function buildPreflightResponse(): Response {
  return withCorsHeaders(new Response(null, { status: 204 }));
}
