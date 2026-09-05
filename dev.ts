import home from "./src/index.html";
import en from "./src/en/index.html";

const server = Bun.serve({
  port: 3000,
  development: true,
  routes: {
    "/": home,
    "/index.html": home,
    "/en": en,
    "/en/": en,
    "/en/index.html": en,
  },
});

console.log(`dev server: ${server.url}`);
