import { NextResponse } from "next/server";
import { buildLiveTopUpFundingSnapshot } from "@/lib/polymarket/live-topup-status";
import { NO_STORE_HEADERS } from "@/lib/polymarket/cache-headers";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const requiredAmount = Number(url.searchParams.get("requiredAmount") ?? 0);
  const snapshot = await buildLiveTopUpFundingSnapshot({
    address: url.searchParams.get("address"),
    requiredAmount: Number.isFinite(requiredAmount) ? Math.max(requiredAmount, 0) : 0
  });

  return NextResponse.json(snapshot, {
    headers: NO_STORE_HEADERS
  });
}
