import { NextResponse } from "next/server";
import { NO_STORE_HEADERS } from "@/lib/polymarket/cache-headers";
import {
  getPolymarketMarketBySlug,
  getPolymarketMarketPriceHistory
} from "@/lib/polymarket/markets";

export async function GET(
  request: Request,
  context: { params: Promise<{ slug: string }> }
) {
  const { slug } = await context.params;
  const url = new URL(request.url);
  const tokenIdFromQuery = url.searchParams.get("tokenId");
  const marketResult = tokenIdFromQuery
    ? null
    : await getPolymarketMarketBySlug(slug, { cacheStrategy: "hot-detail-refresh" });
  const tokenId =
    tokenIdFromQuery ??
    marketResult?.data?.outcomes.find((outcome) => outcome.tokenId)?.tokenId ??
    null;
  const result = await getPolymarketMarketPriceHistory({ tokenId });

  return NextResponse.json(result, {
    status: result.ok ? 200 : 503,
    headers: NO_STORE_HEADERS
  });
}
