import { NextResponse } from "next/server";
import { buildFundingPanelViewModel } from "@/features/prediction/funding/adapter";
import { NO_STORE_HEADERS } from "@/lib/polymarket/cache-headers";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const funding = await buildFundingPanelViewModel(url.searchParams.get("address"));

  return NextResponse.json(funding.readiness, {
    headers: NO_STORE_HEADERS
  });
}
