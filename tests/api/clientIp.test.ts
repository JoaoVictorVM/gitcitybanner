import { describe, expect, test } from "bun:test";
import { extractClientIp } from "../../api/_lib/clientIp";

function request(forwardedFor?: string): Request {
  const headers: Record<string, string> = {};
  if (forwardedFor !== undefined) headers["x-forwarded-for"] = forwardedFor;
  return new Request("https://proxy.test/api/contributions", { headers });
}

describe("extractClientIp", () => {
  test("extracts the first hop from a single-IP header", () => {
    expect(extractClientIp(request("203.0.113.5"))).toBe("203.0.113.5");
  });

  test("extracts the left-most hop from a multi-hop header", () => {
    expect(extractClientIp(request("203.0.113.5, 10.0.0.1"))).toBe("203.0.113.5");
  });

  test("trims surrounding whitespace from the first hop", () => {
    expect(extractClientIp(request("  203.0.113.5  , 10.0.0.1"))).toBe("203.0.113.5");
  });

  test("accepts an IPv6 address", () => {
    expect(extractClientIp(request("2001:db8::1"))).toBe("2001:db8::1");
  });

  test("returns null when the header is missing", () => {
    expect(extractClientIp(request())).toBeNull();
  });

  test("returns null when the header is empty", () => {
    expect(extractClientIp(request(""))).toBeNull();
  });

  test("returns null when the first hop is empty", () => {
    expect(extractClientIp(request(","))).toBeNull();
  });

  test("returns null when the first hop is not a plausible IP token", () => {
    expect(extractClientIp(request("unknown"))).toBeNull();
    expect(extractClientIp(request("<script>"))).toBeNull();
  });
});
