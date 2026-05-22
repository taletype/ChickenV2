import { normalizePredictionCategory } from "@/lib/polymarket/categories";
import { listPolymarketMarkets } from "@/lib/polymarket/markets";
import type { PolymarketMarket } from "@/lib/polymarket/types";
import type {
  PredictionMarketCardViewModel,
  PredictionMarketFeedViewModel
} from "../types";
import {
  normalizePredictionFeedSort,
  type PredictionFeedSort
} from "../routes";

function normalizeSearch(value: string | null | undefined) {
  return value?.trim() ?? "";
}

export function toMarketCardViewModel(
  market: PolymarketMarket,
  locale: string
): PredictionMarketCardViewModel {
  const pricedOutcomes = market.outcomes.filter((outcome) => outcome.price !== null);
  const bestOutcome =
    pricedOutcomes.length > 0
      ? pricedOutcomes.reduce((best, outcome) =>
          (outcome.price ?? 0) > (best.price ?? 0) ? outcome : best
        )
      : null;

  return {
    id: market.id,
    slug: market.slug,
    href: `/${locale}/polymarket/${market.slug}`,
    question: market.question,
    category: market.category,
    image: market.image,
    volume24hr: market.volume24hr,
    liquidity: market.liquidity,
    bestOutcome: bestOutcome
      ? {
          label: bestOutcome.label,
          price: bestOutcome.price
        }
      : null,
    outcomes: market.outcomes.map((outcome) => ({
      label: outcome.label,
      price: outcome.price,
      tokenId: outcome.tokenId
    })),
    tradable:
      market.active &&
      !market.closed &&
      !market.archived &&
      market.outcomes.some((outcome) => outcome.tradable),
    endDate: market.endDate,
    updatedAt: market.sourceUpdatedAt
  };
}

function marketMatchesSearch(
  market: PredictionMarketCardViewModel,
  search: string
) {
  if (!search) {
    return true;
  }

  const needle = search.toLowerCase();
  const haystack = [
    market.question,
    market.category,
    market.bestOutcome?.label,
    ...market.outcomes.map((outcome) => outcome.label)
  ]
    .filter((value): value is string => Boolean(value))
    .join(" ")
    .toLowerCase();

  return haystack.includes(needle);
}

function timestampValue(value: string | null) {
  if (!value) {
    return 0;
  }

  const timestamp = Date.parse(value);
  return Number.isFinite(timestamp) ? timestamp : 0;
}

function sortMarkets(
  markets: PredictionMarketCardViewModel[],
  sort: PredictionFeedSort
) {
  return [...markets].sort((left, right) => {
    if (sort === "liquidity") {
      return (right.liquidity ?? 0) - (left.liquidity ?? 0);
    }

    if (sort === "recent") {
      return timestampValue(right.updatedAt) - timestampValue(left.updatedAt);
    }

    return (right.volume24hr ?? 0) - (left.volume24hr ?? 0);
  });
}

export async function buildMarketFeedViewModel(options: {
  locale: string;
  category?: string | null;
  search?: string | null;
  sort?: string | null;
  limit?: number;
}): Promise<PredictionMarketFeedViewModel> {
  const selectedCategory = normalizePredictionCategory(options.category);
  const selectedSearch = normalizeSearch(options.search);
  const selectedSort = normalizePredictionFeedSort(options.sort);
  const result = await listPolymarketMarkets({
    limit: options.limit ?? (selectedSearch ? 48 : 24),
    category: selectedCategory,
    cacheStrategy: "demand-refresh"
  });

  if (!result.ok) {
    return {
      status: "unavailable",
      markets: [],
      freshness: result.freshness,
      selectedCategory,
      selectedSearch,
      selectedSort,
      error: result.error
    };
  }

  const markets = sortMarkets(
    result.data
      .map((market) => toMarketCardViewModel(market, options.locale))
      .filter((market) => marketMatchesSearch(market, selectedSearch)),
    selectedSort
  );

  return {
    status: markets.length > 0 ? "ready" : "empty",
    markets,
    freshness: result.freshness,
    selectedCategory,
    selectedSearch,
    selectedSort,
    error: null
  };
}
