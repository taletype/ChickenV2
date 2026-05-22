import { NextResponse } from "next/server";
import { MARKET_CACHE_HEADERS } from "@/lib/polymarket/cache-headers";
import { getPolymarketMarketBySlug } from "@/lib/polymarket/markets";

export async function GET(
  _request: Request,
  context: { params: Promise<{ slug: string }> }
) {
  const { slug } = await context.params;
  const result = await getPolymarketMarketBySlug(slug, {
    cacheStrategy: "hot-detail-refresh"
  });

  return NextResponse.json(result, {
    status: result.ok ? 200 : 404,
    headers: MARKET_CACHE_HEADERS
  });
}
