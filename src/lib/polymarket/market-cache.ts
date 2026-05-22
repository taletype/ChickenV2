import "server-only";
import { getServerEnv } from "@/lib/env/server-env";

type CacheEntry<T> = {
  expiresAt: number;
  value: T;
};

const memoryCache = new Map<string, CacheEntry<unknown>>();

export function getCachedValue<T>(key: string): T | null {
  const entry = memoryCache.get(key);

  if (!entry || entry.expiresAt <= Date.now()) {
    memoryCache.delete(key);
    return null;
  }

  return entry.value as T;
}

export function setCachedValue<T>(key: string, value: T, ttlMs?: number) {
  const env = getServerEnv();

  memoryCache.set(key, {
    value,
    expiresAt: Date.now() + (ttlMs ?? env.POLYMARKET_MARKET_CACHE_TTL_MS)
  });
}

export function clearMarketCache() {
  memoryCache.clear();
}
