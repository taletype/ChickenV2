import { NextResponse } from "next/server";
import { NO_STORE_HEADERS } from "@/lib/polymarket/cache-headers";
import { prepareSignedPolymarketOrder } from "@/lib/polymarket/order-preparation";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as unknown;
  const result = await prepareSignedPolymarketOrder(body, { phase: "prepare" });

  return NextResponse.json(result, {
    headers: NO_STORE_HEADERS,
    status: result.status === "ready" ? 200 : 403
  });
}
