import { NextResponse } from "next/server";
import { buildPortfolioViewModel } from "@/features/prediction/portfolio/adapter";
import { NO_STORE_HEADERS } from "@/lib/polymarket/cache-headers";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const portfolio = await buildPortfolioViewModel({
    address: url.searchParams.get("address")
  });

  return NextResponse.json(portfolio, {
    status: portfolio.status === "unavailable" ? 503 : 200,
    headers: NO_STORE_HEADERS
  });
}
