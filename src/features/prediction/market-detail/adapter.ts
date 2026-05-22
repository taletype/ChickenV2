import { getPolymarketMarketBySlug } from "@/lib/polymarket/markets";
import type { PredictionMarketDetailViewModel } from "../types";
import { toMarketCardViewModel } from "../market-feed/adapter";
import {
  buildMarketActivityViewModel,
  buildMarketOpenOrdersViewModel
} from "../activity/adapter";
import { buildDiscussionViewModel } from "../discussion/adapter";

export async function buildMarketDetailViewModel(options: {
  locale: string;
  slug: string;
}): Promise<PredictionMarketDetailViewModel> {
  const unavailableDiscussion = buildDiscussionViewModel({
    marketSlug: options.slug
  });
  const unavailableActivity = buildMarketActivityViewModel();
  const unavailableOpenOrders = buildMarketOpenOrdersViewModel();
  const result = await getPolymarketMarketBySlug(options.slug, {
    cacheStrategy: "hot-detail-refresh"
  });

  if (!result.ok || !result.data) {
    return {
      status: "unavailable",
      market: null,
      description: null,
      metadata: null,
      discussion: unavailableDiscussion,
      activity: unavailableActivity,
      openOrders: unavailableOpenOrders,
      freshness: result.freshness,
      error: result.error
    };
  }

  return {
    status: "ready",
    market: toMarketCardViewModel(result.data, options.locale),
    description: result.data.description,
    metadata: {
      conditionId: result.data.conditionId,
      createdAt: result.data.createdAt,
      updatedAt: result.data.sourceUpdatedAt,
      endDate: result.data.endDate,
      volume24hr: result.data.volume24hr,
      liquidity: result.data.liquidity,
      minimumOrderSize: result.data.minimumOrderSize,
      tickSize: result.data.tickSize,
      negRisk: result.data.negRisk,
      resolutionSource: result.data.resolutionSource,
      resolutionSourceUrl: result.data.resolutionSourceUrl
    },
    discussion: buildDiscussionViewModel({
      marketSlug: result.data.slug ?? options.slug
    }),
    activity: buildMarketActivityViewModel(),
    openOrders: buildMarketOpenOrdersViewModel(),
    freshness: result.freshness,
    error: null
  };
}
