import "server-only";
import { clobUrl, fetchJson, gammaUrl } from "./endpoints";
import { buildFreshness, unavailableFreshness } from "./data-freshness";
import { getCachedValue, setCachedValue } from "./market-cache";
import { normalizePolymarketMarket, normalizePolymarketMarkets } from "./normalize";
import type {
  MarketCacheStrategy,
  PolymarketMarket,
  PolymarketPricePoint,
  PolymarketReadResult
} from "./types";

export type ListPolymarketMarketsOptions = {
  limit?: number;
  offset?: number;
  category?: string | null;
  cacheStrategy?: MarketCacheStrategy;
};

function unavailableResult<T>(data: T, error: string): PolymarketReadResult<T> {
  return {
    ok: false,
    data,
    freshness: unavailableFreshness(error),
    error,
    source: "unavailable"
  };
}

function mapCategory(category: string | null | undefined) {
  if (!category || category === "trending") {
    return undefined;
  }

  return category;
}

export async function listPolymarketMarkets(
  options: ListPolymarketMarketsOptions = {}
): Promise<PolymarketReadResult<PolymarketMarket[]>> {
  const limit = Math.min(Math.max(options.limit ?? 24, 1), 100);
  const offset = Math.max(options.offset ?? 0, 0);
  const category = mapCategory(options.category);
  const cacheKey = `markets:${limit}:${offset}:${category ?? "all"}`;

  if (options.cacheStrategy !== "no-cache") {
    const cached = getCachedValue<PolymarketReadResult<PolymarketMarket[]>>(cacheKey);
    if (cached) {
      return cached;
    }
  }

  try {
    const url = gammaUrl("/markets", {
      active: true,
      closed: false,
      archived: false,
      limit,
      offset,
      order: "volume24hr",
      ascending: false,
      category
    });
    const raw = await fetchJson<unknown>(url, { cache: "no-store" });
    const data = normalizePolymarketMarkets(raw).filter(
      (market) => market.active && !market.closed && !market.archived
    );
    const result: PolymarketReadResult<PolymarketMarket[]> = {
      ok: true,
      data,
      freshness: buildFreshness(),
      error: null,
      source: "gamma"
    };

    if (options.cacheStrategy !== "no-cache") {
      setCachedValue(cacheKey, result);
    }

    return result;
  } catch (error) {
    return unavailableResult(
      [],
      error instanceof Error ? error.message : "market_feed_unavailable"
    );
  }
}

export async function getPolymarketMarketBySlug(
  slug: string,
  options: { cacheStrategy?: MarketCacheStrategy } = {}
): Promise<PolymarketReadResult<PolymarketMarket | null>> {
  const cacheKey = `market:${slug}`;

  if (options.cacheStrategy !== "no-cache") {
    const cached = getCachedValue<PolymarketReadResult<PolymarketMarket | null>>(
      cacheKey
    );
    if (cached) {
      return cached;
    }
  }

  try {
    const raw = await fetchJson<unknown>(gammaUrl("/markets", { slug }), {
      cache: "no-store"
    });
    const records = Array.isArray(raw) ? raw : [];
    const market =
      records[0] && typeof records[0] === "object"
        ? normalizePolymarketMarket(records[0] as Record<string, unknown>)
        : null;
    const result: PolymarketReadResult<PolymarketMarket | null> = {
      ok: market !== null,
      data: market,
      freshness: market ? buildFreshness() : unavailableFreshness("market_not_found"),
      error: market ? null : "market_not_found",
      source: market ? "gamma" : "unavailable"
    };

    if (options.cacheStrategy !== "no-cache") {
      setCachedValue(cacheKey, result, 30_000);
    }

    return result;
  } catch (error) {
    return unavailableResult(
      null,
      error instanceof Error ? error.message : "market_detail_unavailable"
    );
  }
}

export function normalizePriceHistory(raw: unknown): PolymarketPricePoint[] {
  const records = Array.isArray((raw as { history?: unknown[] })?.history)
    ? (raw as { history: unknown[] }).history
    : Array.isArray(raw)
      ? raw
      : [];

  return records
    .map((record) => {
      if (!record || typeof record !== "object") {
        return null;
      }

      const item = record as Record<string, unknown>;
      const timestamp = Number(item.t ?? item.timestamp ?? item.time);
      const price = Number(item.p ?? item.price);

      if (!Number.isFinite(timestamp) || !Number.isFinite(price)) {
        return null;
      }

      return { timestamp, price };
    })
    .filter((point): point is PolymarketPricePoint => point !== null)
    .sort((a, b) => a.timestamp - b.timestamp);
}

export async function getPolymarketMarketPriceHistory(options: {
  tokenId: string | null | undefined;
  interval?: string;
  fidelity?: number;
}): Promise<PolymarketReadResult<PolymarketPricePoint[]>> {
  if (!options.tokenId) {
    return unavailableResult([], "missing_token_id");
  }

  try {
    const raw = await fetchJson<unknown>(
      clobUrl("/prices-history", {
        market: options.tokenId,
        interval: options.interval ?? "1w",
        fidelity: options.fidelity ?? 60
      }),
      { cache: "no-store" }
    );
    return {
      ok: true,
      data: normalizePriceHistory(raw),
      freshness: buildFreshness(),
      error: null,
      source: "clob"
    };
  } catch (error) {
    return unavailableResult(
      [],
      error instanceof Error ? error.message : "price_history_unavailable"
    );
  }
}
