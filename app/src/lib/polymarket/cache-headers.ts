export const MARKET_CACHE_HEADERS = {
  "cache-control": "public, max-age=20, stale-while-revalidate=60"
} as const;

export const NO_STORE_HEADERS = {
  "cache-control": "no-store"
} as const;
