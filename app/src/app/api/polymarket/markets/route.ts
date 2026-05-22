import { NextResponse } from "next/server";
import { MARKET_CACHE_HEADERS } from "@/lib/polymarket/cache-headers";
import { listPolymarketMarkets } from "@/lib/polymarket/markets";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const limit = Number(url.searchParams.get("limit") ?? 24);
  const category = url.searchParams.get("category");
  const result = await listPolymarketMarkets({
    limit,
    category,
    cacheStrategy: url.searchParams.get("refresh") === "true" ? "no-cache" : "demand-refresh"
  });

  return NextResponse.json(result, {
    headers: MARKET_CACHE_HEADERS
  });
}
