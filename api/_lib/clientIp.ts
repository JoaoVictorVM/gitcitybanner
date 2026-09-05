const IP_TOKEN = /^[0-9a-fA-F.:]+$/;

export function extractClientIp(request: Request): string | null {
  const header = request.headers.get("x-forwarded-for");
  if (!header) return null;

  const first = header.split(",")[0]?.trim() ?? "";
  if (!first || !IP_TOKEN.test(first)) return null;
  if (!first.includes(".") && !first.includes(":")) return null;

  return first;
}
