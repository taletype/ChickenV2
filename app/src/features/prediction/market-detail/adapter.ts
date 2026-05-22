import { getPolymarketMarketBySlug } from "@/lib/polymarket/markets";
import type { PredictionMarketDetailViewModel } from "../types";
import { toMarketCardViewModel } from "../market-feed/adapter";

export async function buildMarketDetailViewModel(options: {
  locale: string;
  slug: string;
}): Promise<PredictionMarketDetailViewModel> {
  const result = await getPolymarketMarketBySlug(options.slug, {
    cacheStrategy: "hot-detail-refresh"
  });

  if (!result.ok || !result.data) {
    return {
      status: "unavailable",
      market: null,
      description: null,
      freshness: result.freshness,
      error: result.error
    };
  }

  return {
    status: "ready",
    market: toMarketCardViewModel(result.data, options.locale),
    description: result.data.description,
    freshness: result.freshness,
    error: null
  };
}
