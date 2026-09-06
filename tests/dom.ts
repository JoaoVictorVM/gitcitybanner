import { GlobalRegistrator } from "@happy-dom/global-registrator";

// Bun shares one global scope across test files, so a second registration would throw.
export function registerDom(): void {
  if (typeof globalThis.document === "undefined") GlobalRegistrator.register();
}
