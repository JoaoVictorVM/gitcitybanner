import { rm, mkdir } from "node:fs/promises";
import { posix, dirname } from "node:path";

import { LOCAL_API_BASE_URL } from "./src/config";

const BASE_PATH = "/gitcitybanner/";
const SRC_DIR = "src";
const OUT_DIR = "dist";

const HTML_ENTRIES = ["index.html", "en/index.html"];
const SCRIPT_ENTRY = `${SRC_DIR}/app.ts`;
const STYLE_ENTRY = `${SRC_DIR}/styles/main.css`;

const API_BASE_URL = process.env.PROD_API_URL || LOCAL_API_BASE_URL;

function typecheck(): void {
  const result = Bun.spawnSync(["bun", "x", "tsc", "--noEmit"], {
    stdout: "inherit",
    stderr: "inherit",
  });
  if (result.exitCode !== 0) {
    console.error("[build] type check failed — aborting before writing any output");
    process.exit(1);
  }
}

function rewriteAssetReferences(html: string, htmlDir: string): string {
  return html.replace(/\s(href|src)="([^"]+)"/g, (match, attribute: string, value: string) => {
    if (!value.startsWith("./") && !value.startsWith("../")) return match;
    let resolved = posix.normalize(posix.join(htmlDir, value)).replace(/^\.\//, "");
    if (resolved === "." || resolved === "./") resolved = "";
    if (resolved.endsWith(".ts")) resolved = `${resolved.slice(0, -3)}.js`;
    return ` ${attribute}="${BASE_PATH}${resolved}"`;
  });
}

async function buildScript(): Promise<void> {
  const result = await Bun.build({
    entrypoints: [SCRIPT_ENTRY],
    outdir: OUT_DIR,
    naming: "[name].js",
    target: "browser",
    format: "esm",
    minify: true,
    define: {
      __PRODUCTION_API_BASE_URL__: JSON.stringify(API_BASE_URL),
    },
  });
  if (!result.success) {
    for (const log of result.logs) console.error(log);
    throw new Error("script bundle failed");
  }
}

async function buildStyles(): Promise<void> {
  const result = await Bun.build({
    entrypoints: [STYLE_ENTRY],
    outdir: `${OUT_DIR}/styles`,
    naming: "[name].[ext]",
    minify: true,
  });
  if (!result.success) {
    for (const log of result.logs) console.error(log);
    throw new Error("stylesheet bundle failed");
  }
}

async function buildHtml(): Promise<void> {
  for (const entry of HTML_ENTRIES) {
    const source = await Bun.file(`${SRC_DIR}/${entry}`).text();
    const outPath = `${OUT_DIR}/${entry}`;
    await mkdir(dirname(outPath), { recursive: true });
    await Bun.write(outPath, rewriteAssetReferences(source, posix.dirname(entry) === "." ? "" : posix.dirname(entry)));
  }
}

typecheck();
await rm(OUT_DIR, { recursive: true, force: true });
await buildScript();
await buildStyles();
await buildHtml();

console.log(`[build] wrote ${OUT_DIR}/ with base path ${BASE_PATH} and api base url ${API_BASE_URL}`);
