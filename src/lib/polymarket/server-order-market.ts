import "server-only";
import { getPolymarketMarketBySlug } from "./markets";
import type { PolymarketMarket, PolymarketOutcome } from "./types";

export type CanonicalOrderMarketError =
  | "market_slug_required"
  | "market_not_found"
  | "market_id_mismatch"
  | "market_not_tradable"
  | "invalid_market_token";

export type CanonicalPolymarketOrderMarketResult =
  | {
      status: "ready";
      market: PolymarketMarket;
      outcome: PolymarketOutcome;
      tickSize: number;
      minimumOrderSize: number | null;
      error: null;
    }
  | {
      status: "blocked";
      market: PolymarketMarket | null;
      outcome: null;
      tickSize: number;
      minimumOrderSize: number | null;
      error: CanonicalOrderMarketError;
    };

export type ResolveCanonicalPolymarketOrderMarketOptions = {
  readMarketBySlug?: (slug: string) => Promise<PolymarketMarket | null>;
};

function marketTradable(market: PolymarketMarket) {
  return market.active && !market.closed && !market.archived;
}

export async function resolveCanonicalPolymarketOrderMarket(
  input: {
    marketId?: string | null;
    marketSlug?: string | null;
    tokenId?: string | null;
  },
  options: ResolveCanonicalPolymarketOrderMarketOptions = {}
): Promise<CanonicalPolymarketOrderMarketResult> {
  const slug = input.marketSlug?.trim();
  if (!slug) {
    return {
      status: "blocked",
      market: null,
      outcome: null,
      tickSize: 0.01,
      minimumOrderSize: null,
      error: "market_slug_required"
    };
  }

  const market = options.readMarketBySlug
    ? await options.readMarketBySlug(slug)
    : (
        await getPolymarketMarketBySlug(slug, {
          cacheStrategy: "no-cache"
        })
      ).data;

  if (!market) {
    return {
      status: "blocked",
      market: null,
      outcome: null,
      tickSize: 0.01,
      minimumOrderSize: null,
      error: "market_not_found"
    };
  }

  if (input.marketId && input.marketId !== market.id) {
    return {
      status: "blocked",
      market,
      outcome: null,
      tickSize: market.tickSize,
      minimumOrderSize: market.minimumOrderSize,
      error: "market_id_mismatch"
    };
  }

  if (!marketTradable(market)) {
    return {
      status: "blocked",
      market,
      outcome: null,
      tickSize: market.tickSize,
      minimumOrderSize: market.minimumOrderSize,
      error: "market_not_tradable"
    };
  }

  const outcome = market.outcomes.find(
    (candidate) => candidate.tokenId === input.tokenId && candidate.tradable
  );

  if (!outcome) {
    return {
      status: "blocked",
      market,
      outcome: null,
      tickSize: market.tickSize,
      minimumOrderSize: market.minimumOrderSize,
      error: "invalid_market_token"
    };
  }

  return {
    status: "ready",
    market,
    outcome,
    tickSize: market.tickSize,
    minimumOrderSize: market.minimumOrderSize,
    error: null
  };
}

export function canonicalOrderMarketErrorLabel(
  error: CanonicalOrderMarketError | null
) {
  switch (error) {
    case "market_slug_required":
    case "market_not_found":
    case "market_id_mismatch":
      return "Market is unavailable.";
    case "market_not_tradable":
      return "Market is not tradable.";
    case "invalid_market_token":
      return "Token does not belong to the canonical market.";
    default:
      return "Order market validation failed.";
  }
}
