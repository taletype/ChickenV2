import type { DataFreshness } from "./types";

export const DEFAULT_STALE_AFTER_MS = 90_000;

export function buildFreshness(options?: {
  fetchedAt?: string;
  staleAfterMs?: number;
  degraded?: boolean;
  reason?: string | null;
}): DataFreshness {
  const fetchedAt = options?.fetchedAt ?? new Date().toISOString();
  const ageMs = Math.max(0, Date.now() - Date.parse(fetchedAt));
  const staleAfterMs = options?.staleAfterMs ?? DEFAULT_STALE_AFTER_MS;

  return {
    fetchedAt,
    ageMs,
    stale: ageMs > staleAfterMs,
    degraded: options?.degraded ?? false,
    reason: options?.reason ?? null
  };
}

export function unavailableFreshness(reason: string): DataFreshness {
  return {
    fetchedAt: new Date().toISOString(),
    ageMs: 0,
    stale: true,
    degraded: true,
    reason
  };
}
