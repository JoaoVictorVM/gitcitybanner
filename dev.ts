import { handler as contributions } from "./api/contributions";
import home from "./src/index.html";
import en from "./src/en/index.html";
import gerar from "./src/gerar/index.html";
import generate from "./src/en/generate/index.html";

const server = Bun.serve({
  port: 3000,
  development: true,
  routes: {
    "/": home,
    "/index.html": home,
    "/en": en,
    "/en/": en,
    "/en/index.html": en,
    "/gerar": gerar,
    "/gerar/": gerar,
    "/gerar/index.html": gerar,
    "/en/generate": generate,
    "/en/generate/": generate,
    "/en/generate/index.html": generate,
    "/api/contributions": contributions,
  },
});

console.log(`dev server: ${server.url}`);
