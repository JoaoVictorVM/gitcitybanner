import { describe, expect, test } from "bun:test";
import { isValidUsername, USERNAME_PATTERN } from "../../src/username/validate";

describe("isValidUsername", () => {
  test("accepts valid usernames", () => {
    for (const value of ["torvalds", "a", "a-b-c", "A1", "9", "a".repeat(39)]) {
      expect(isValidUsername(value), value).toBe(true);
    }
  });

  test("rejects invalid usernames", () => {
    for (const value of ["torv@lds", "-torvalds", "torvalds-", "torv--alds", "a".repeat(40), "", "tor valds"]) {
      expect(isValidUsername(value), JSON.stringify(value)).toBe(false);
    }
  });

  test("matches the GitHub username rule from the product spec", () => {
    expect(USERNAME_PATTERN.source).toBe("^[A-Za-z0-9](?:[A-Za-z0-9]|-(?=[A-Za-z0-9])){0,38}$");
  });
});
