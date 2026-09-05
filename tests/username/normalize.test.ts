import { describe, expect, test } from "bun:test";
import { normalizeUsername } from "../../src/username/normalize";

describe("normalizeUsername", () => {
  test("trims surrounding whitespace", () => {
    expect(normalizeUsername("  torvalds  ")).toBe("torvalds");
  });

  test("strips a leading @", () => {
    expect(normalizeUsername("@torvalds")).toBe("torvalds");
    expect(normalizeUsername("  @torvalds ")).toBe("torvalds");
  });

  test("extracts the username segment from a profile URL", () => {
    expect(normalizeUsername("https://github.com/torvalds")).toBe("torvalds");
    expect(normalizeUsername("github.com/torvalds/")).toBe("torvalds");
    expect(normalizeUsername("http://www.github.com/torvalds?tab=repositories")).toBe("torvalds");
    expect(normalizeUsername("https://github.com/torvalds/linux")).toBe("torvalds");
  });

  test("leaves a bare username unchanged", () => {
    expect(normalizeUsername("torvalds")).toBe("torvalds");
    expect(normalizeUsername("a-b-c")).toBe("a-b-c");
  });

  test("returns an empty string for empty input", () => {
    expect(normalizeUsername("   ")).toBe("");
    expect(normalizeUsername("https://github.com/")).toBe("");
  });
});
