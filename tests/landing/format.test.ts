import { describe, expect, test } from "bun:test";

import { formatContributions, formatDay } from "../../src/landing/format";

describe("formatContributions", () => {
  test("picks the right plural form in portuguese", () => {
    expect(formatContributions(0, "pt-BR")).toBe("nenhuma contribuição");
    expect(formatContributions(1, "pt-BR")).toBe("1 contribuição");
    expect(formatContributions(1284, "pt-BR")).toBe("1.284 contribuições");
  });

  test("picks the right plural form in english", () => {
    expect(formatContributions(0, "en")).toBe("no contributions");
    expect(formatContributions(1, "en")).toBe("1 contribution");
    expect(formatContributions(1284, "en")).toBe("1,284 contributions");
  });
});

describe("formatDay", () => {
  test("formats the calendar date without shifting it across time zones", () => {
    expect(formatDay("2026-03-01", "pt-BR")).toBe("1 de mar. de 2026");
    expect(formatDay("2026-03-01", "en")).toBe("Mar 1, 2026");
  });
});
