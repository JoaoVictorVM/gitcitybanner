import type { ContributionData } from "./types";

export const CACHE_TTL_MS = 1_800_000;
export const CACHE_CONTROL_SUCCESS = "public, max-age=1800, s-maxage=1800";
export const CACHE_CONTROL_ERROR = "no-store";

interface CacheEntry {
  data: ContributionData;
  expiresAt: number;
}

const store = new Map<string, CacheEntry>();

function cacheKey(username: string): string {
  return username.toLowerCase();
}

export function getCached(username: string): ContributionData | undefined {
  const key = cacheKey(username);
  const entry = store.get(key);
  if (!entry) return undefined;

  if (Date.now() >= entry.expiresAt) {
    store.delete(key);
    return undefined;
  }

  return entry.data;
}

export function setCached(username: string, data: ContributionData): void {
  store.set(cacheKey(username), { data, expiresAt: Date.now() + CACHE_TTL_MS });
}

export function clearCache(): void {
  store.clear();
}
