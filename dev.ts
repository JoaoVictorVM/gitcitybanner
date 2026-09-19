import { handler as contributions } from "./api/contributions";
import home from "./src/index.html";
import en from "./src/en/index.html";
import gerar from "./src/gerar/index.html";
import generate from "./src/en/generate/index.html";
import favicon from "./src/favicon.svg" with { type: "file" };
import touchIcon from "./src/apple-touch-icon.png" with { type: "file" };

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
    "/favicon.svg": () => new Response(Bun.file(favicon)),
    "/apple-touch-icon.png": () => new Response(Bun.file(touchIcon)),
    "/api/contributions": contributions,
  },
});

console.log(`dev server: ${server.url}`);
