import { beforeEach, describe, expect, test } from "bun:test";

import {
  clearContributionModel,
  getContributionModel,
  setContributionModel,
} from "../../src/contributions/session";
import { buildModel } from "./fixture";

describe("contribution session store", () => {
  beforeEach(() => {
    clearContributionModel();
  });

  test("starts empty", () => {
    expect(getContributionModel()).toBeNull();
  });

  test("round-trips the last stored model", () => {
    const model = buildModel({ username: "octocat", totalContributions: 42 });
    setContributionModel(model);

    expect(getContributionModel()).toBe(model);
  });

  test("replaces the stored model on a second generation", () => {
    const first = buildModel({ username: "torvalds" });
    const second = buildModel({ username: "octocat" });
    setContributionModel(first);
    setContributionModel(second);

    expect(getContributionModel()).toBe(second);
  });

  test("reading twice issues no side effects", () => {
    const model = buildModel();
    setContributionModel(model);

    expect(getContributionModel()).toBe(model);
    expect(getContributionModel()).toBe(model);
  });
});
