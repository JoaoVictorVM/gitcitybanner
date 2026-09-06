declare const __PRODUCTION_API_BASE_URL__: string | undefined;

export const LOCAL_API_BASE_URL = "http://localhost:3000";

export const PRODUCTION_API_BASE_URL: string =
  typeof __PRODUCTION_API_BASE_URL__ === "string" && __PRODUCTION_API_BASE_URL__.length > 0
    ? __PRODUCTION_API_BASE_URL__
    : LOCAL_API_BASE_URL;
