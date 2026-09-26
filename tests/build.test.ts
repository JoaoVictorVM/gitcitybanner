import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { existsSync } from "node:fs";
import { rm } from "node:fs/promises";
import { join } from "node:path";

const ROOT = join(import.meta.dir, "..");
const DIST = join(ROOT, "dist");
const BUILD_TIMEOUT_MS = 60_000;

function runBuild(env: Record<string, string | undefined> = {}) {
  return Bun.spawnSync(["bun", "run", "build.ts"], {
    cwd: ROOT,
    stdout: "pipe",
    stderr: "pipe",
    env: { ...process.env, ...env },
  });
}

describe("production build", () => {
  beforeAll(() => {
    const result = runBuild();
    if (result.exitCode !== 0) {
      throw new Error(`build failed:\n${result.stderr.toString()}`);
    }
  }, BUILD_TIMEOUT_MS);

  test("produces the four HTML entry points and one shared JS bundle", () => {
    expect(existsSync(join(DIST, "index.html"))).toBe(true);
    expect(existsSync(join(DIST, "en", "index.html"))).toBe(true);
    expect(existsSync(join(DIST, "gerar", "index.html"))).toBe(true);
    expect(existsSync(join(DIST, "en", "generate", "index.html"))).toBe(true);
    expect(existsSync(join(DIST, "app.js"))).toBe(true);
    expect(existsSync(join(DIST, "styles", "main.css"))).toBe(true);
  });

  test("rewrites every relative asset reference to the site root", async () => {
    for (const entry of ["index.html", "en/index.html", "gerar/index.html", "en/generate/index.html"]) {
      const html = await Bun.file(join(DIST, entry)).text();
      const offenders = [...html.matchAll(/\s(?:href|src)="(\.{1,2}\/[^"]*)"/g)].map(
        (match) => match[1]!,
      );
      expect(offenders, entry).toEqual([]);
      expect(html).toContain('src="/app.js"');
      expect(html).toContain('href="/styles/main.css"');
    }
  });

  test("keeps the declared lang on each entry point", async () => {
    expect(await Bun.file(join(DIST, "index.html")).text()).toContain('<html lang="pt-BR">');
    expect(await Bun.file(join(DIST, "en", "index.html")).text()).toContain('<html lang="en">');
    expect(await Bun.file(join(DIST, "gerar", "index.html")).text()).toContain('<html lang="pt-BR">');
    expect(await Bun.file(join(DIST, "en", "generate", "index.html")).text()).toContain('<html lang="en">');
  });

  test("rewrites the language selector links to the site root", async () => {
    expect(await Bun.file(join(DIST, "index.html")).text()).toContain('href="/en/"');
    expect(await Bun.file(join(DIST, "en", "index.html")).text()).toContain('href="/"');
    expect(await Bun.file(join(DIST, "gerar", "index.html")).text()).toContain('href="/en/generate/"');
    expect(await Bun.file(join(DIST, "en", "generate", "index.html")).text()).toContain('href="/gerar/"');
  });

  test("the landing links to the generator in its own language", async () => {
    expect(await Bun.file(join(DIST, "index.html")).text()).toContain('href="/gerar/"');
    expect(await Bun.file(join(DIST, "en", "index.html")).text()).toContain('href="/en/generate/"');
  });

  test("copies the favicon files into the output root", async () => {
    expect(existsSync(join(DIST, "favicon.svg"))).toBe(true);
    expect(existsSync(join(DIST, "apple-touch-icon.png"))).toBe(true);
    expect(await Bun.file(join(DIST, "favicon.svg")).text()).toContain("<svg");
  });

  test("every page declares the favicon from the site root", async () => {
    for (const entry of ["index.html", "en/index.html", "gerar/index.html", "en/generate/index.html"]) {
      const html = await Bun.file(join(DIST, entry)).text();
      expect(html, entry).toContain('rel="icon" href="/favicon.svg" type="image/svg+xml"');
      expect(html, entry).toContain('rel="apple-touch-icon" href="/apple-touch-icon.png"');
    }
  });

  test("ships the Geist font files and their stylesheet unbundled", async () => {
    for (const font of [
      "geist-latin-wght-normal.woff2",
      "geist-latin-ext-wght-normal.woff2",
      "geist-mono-latin-wght-normal.woff2",
      "geist-mono-latin-ext-wght-normal.woff2",
    ]) {
      expect(existsSync(join(DIST, "fonts", font)), font).toBe(true);
    }
    const fonts = await Bun.file(join(DIST, "styles", "fonts.css")).text();
    expect(fonts).toContain('url("../fonts/geist-latin-wght-normal.woff2")');
    expect(await Bun.file(join(DIST, "styles", "main.css")).text()).not.toContain("data:font");
  });

  test("every page loads the font stylesheet from the site root", async () => {
    for (const entry of ["index.html", "en/index.html", "gerar/index.html", "en/generate/index.html"]) {
      const html = await Bun.file(join(DIST, entry)).text();
      expect(html, entry).toContain('href="/styles/fonts.css"');
    }
  });

  test("keeps the landing animation libraries out of the shared bundle", async () => {
    const app = await Bun.file(join(DIST, "app.js")).text();
    expect(app).not.toContain("ScrollTrigger");
    expect(app).toContain("chunks/");
  });

  test("every page keeps the same fixed tab title", async () => {
    for (const entry of ["index.html", "en/index.html", "gerar/index.html", "en/generate/index.html"]) {
      const html = await Bun.file(join(DIST, entry)).text();
      expect(html, entry).toContain("<title>gitcitybanner</title>");
      expect(html, entry).not.toContain("data-i18n-title");
    }
    const bundle = await Bun.file(join(DIST, "app.js")).text();
    expect(bundle).not.toContain("document.title");
  });

  test("the generator links back to the landing", async () => {
    expect(await Bun.file(join(DIST, "gerar", "index.html")).text()).toContain('class="site-title" href="/"');
    expect(await Bun.file(join(DIST, "en", "generate", "index.html")).text()).toContain('class="site-title" href="/en/"');
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
  }, BUILD_TIMEOUT_MS);
});

describe("api base url", () => {
  test("the bundle calls the api on the same origin with no build-time url", async () => {
    const bundle = await Bun.file(join(DIST, "app.js")).text();
    expect(bundle).toContain("/api/contributions");
    expect(bundle).not.toContain("localhost:3000");
    expect(bundle).not.toContain("__PRODUCTION_API_BASE_URL__");
    expect(bundle).not.toContain("process.env");
    expect(bundle).not.toContain("import.meta.env");
  });
});
