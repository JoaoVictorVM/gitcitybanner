import { describe, expect, test } from "bun:test";
import { isValidUsername } from "../../api/_lib/validate";

describe("isValidUsername", () => {
  test("accepts valid GitHub usernames", () => {
    for (const username of ["torvalds", "a", "a-b-c", "JoaoVictorVM", "user123", "a".repeat(39)]) {
      expect(isValidUsername(username), username).toBe(true);
    }
  });

  test("rejects invalid GitHub usernames", () => {
    for (const username of ["", "-torvalds", "torvalds-", "tor--valds", "torv@lds", "a".repeat(40), "tor valds"]) {
      expect(isValidUsername(username), JSON.stringify(username)).toBe(false);
    }
  });

  test("rejects non-string input", () => {
    expect(isValidUsername(null)).toBe(false);
    expect(isValidUsername(undefined)).toBe(false);
  });
});
