import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { existsSync } from "node:fs";
import { rm } from "node:fs/promises";
import { join } from "node:path";

import { LOCAL_API_BASE_URL, PRODUCTION_API_BASE_URL } from "../src/config";

const ROOT = join(import.meta.dir, "..");
const DIST = join(ROOT, "dist");

function runBuild(env: Record<string, string | undefined> = {}) {
  return Bun.spawnSync(["bun", "run", "build.ts"], {
    cwd: ROOT,
    stdout: "pipe",
    stderr: "pipe",
    env: { ...process.env, PROD_API_URL: undefined, ...env },
  });
}

describe("production build", () => {
  beforeAll(() => {
    const result = runBuild();
    if (result.exitCode !== 0) {
      throw new Error(`build failed:\n${result.stderr.toString()}`);
    }
  });

  test("produces two HTML entry points and one shared JS bundle", () => {
    expect(existsSync(join(DIST, "index.html"))).toBe(true);
    expect(existsSync(join(DIST, "en", "index.html"))).toBe(true);
    expect(existsSync(join(DIST, "app.js"))).toBe(true);
    expect(existsSync(join(DIST, "styles", "main.css"))).toBe(true);
  });

  test("emits no root-absolute asset references", async () => {
    for (const entry of ["index.html", "en/index.html"]) {
      const html = await Bun.file(join(DIST, entry)).text();
      const offenders = [...html.matchAll(/\s(?:href|src)="(\/[^"]*)"/g)]
        .map((match) => match[1]!)
        .filter((value) => !value.startsWith("/gitcitybanner/"));
      expect(offenders, entry).toEqual([]);
    }
  });

  test("keeps the declared lang on each entry point", async () => {
    expect(await Bun.file(join(DIST, "index.html")).text()).toContain('<html lang="pt-BR">');
    expect(await Bun.file(join(DIST, "en", "index.html")).text()).toContain('<html lang="en">');
  });

  test("rewrites the language selector links to the base path", async () => {
    expect(await Bun.file(join(DIST, "index.html")).text()).toContain('href="/gitcitybanner/en/"');
    expect(await Bun.file(join(DIST, "en", "index.html")).text()).toContain('href="/gitcitybanner/"');
  });
});

describe("type safety", () => {
  const brokenFile = join(ROOT, "src", "__type_error_probe.ts");

  afterAll(async () => {
    await rm(brokenFile, { force: true });
  });

  test("fails on a TypeScript error without overwriting the output", async () => {
    await Bun.write(brokenFile, "export const broken: number = 'not a number';\n");
    const result = runBuild();
    await rm(brokenFile, { force: true });

    expect(result.exitCode).not.toBe(0);
    // The previous successful output survives, so a broken bundle is never published.
    expect(existsSync(join(DIST, "index.html"))).toBe(true);
  });
});

describe("production api base url", () => {
  test("exposes a single non-empty string constant", () => {
    expect(typeof PRODUCTION_API_BASE_URL).toBe("string");
    expect(PRODUCTION_API_BASE_URL.length).toBeGreaterThan(0);
  });

  test("inlines PROD_API_URL as a literal in the bundle", async () => {
    const url = "https://gitcitybanner.vercel.app";
    const result = runBuild({ PROD_API_URL: url });
    expect(result.exitCode).toBe(0);

    const bundle = await Bun.file(join(DIST, "app.js")).text();
    expect(bundle).toContain(url);
    expect(bundle).not.toContain("__PRODUCTION_API_BASE_URL__");
    expect(bundle).not.toContain("process.env");
    expect(bundle).not.toContain("import.meta.env");
  });

  test("falls back to the local base url when PROD_API_URL is unset", async () => {
    const result = runBuild();
    expect(result.exitCode).toBe(0);

    const bundle = await Bun.file(join(DIST, "app.js")).text();
    expect(bundle).toContain(LOCAL_API_BASE_URL);
    expect(bundle).not.toContain("undefined");
  });
});
