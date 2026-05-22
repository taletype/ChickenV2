import { getPolymarketMarketPriceHistory } from "@/lib/polymarket/markets";
import type { PredictionChartViewModel } from "../types";

export function buildChartViewModelFromPoints(
  points: PredictionChartViewModel["points"],
  error: string | null = null
): PredictionChartViewModel {
  if (error) {
    return {
      status: "unavailable",
      points: [],
      latestPrice: null,
      error
    };
  }

  return {
    status: points.length > 0 ? "ready" : "empty",
    points,
    latestPrice: points.at(-1)?.price ?? null,
    error: null
  };
}

export async function buildPredictionChartViewModel(tokenId: string | null | undefined) {
  const result = await getPolymarketMarketPriceHistory({ tokenId });

  if (!result.ok) {
    return buildChartViewModelFromPoints([], result.error);
  }

  return buildChartViewModelFromPoints(result.data);
}
