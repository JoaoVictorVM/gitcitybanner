import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { existsSync } from "node:fs";
import { rm } from "node:fs/promises";
import { join } from "node:path";

const ROOT = join(import.meta.dir, "..");
const DIST = join(ROOT, "dist");

function runBuild() {
  return Bun.spawnSync(["bun", "run", "build.ts"], { cwd: ROOT, stdout: "pipe", stderr: "pipe" });
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
