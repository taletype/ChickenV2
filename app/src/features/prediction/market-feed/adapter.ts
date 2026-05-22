import { normalizePredictionCategory } from "@/lib/polymarket/categories";
import { listPolymarketMarkets } from "@/lib/polymarket/markets";
import type { PolymarketMarket } from "@/lib/polymarket/types";
import type {
  PredictionMarketCardViewModel,
  PredictionMarketFeedViewModel
} from "../types";

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
    endDate: market.endDate
  };
}

export async function buildMarketFeedViewModel(options: {
  locale: string;
  category?: string | null;
  limit?: number;
}): Promise<PredictionMarketFeedViewModel> {
  const selectedCategory = normalizePredictionCategory(options.category);
  const result = await listPolymarketMarkets({
    limit: options.limit ?? 24,
    category: selectedCategory,
    cacheStrategy: "demand-refresh"
  });

  if (!result.ok) {
    return {
      status: "unavailable",
      markets: [],
      freshness: result.freshness,
      selectedCategory,
      error: result.error
    };
  }

  const markets = result.data.map((market) =>
    toMarketCardViewModel(market, options.locale)
  );

  return {
    status: markets.length > 0 ? "ready" : "empty",
    markets,
    freshness: result.freshness,
    selectedCategory,
    error: null
  };
}
