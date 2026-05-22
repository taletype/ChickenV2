import { NextResponse } from "next/server";
import { createLiveClobTradingAdapter } from "@/lib/polymarket/adapters/live-clob-adapter";
import { NO_STORE_HEADERS } from "@/lib/polymarket/cache-headers";
import { submitSignedOrderRequestSchema } from "@/lib/polymarket/submit-signed-order-request";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as unknown;
  const parsed = submitSignedOrderRequestSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      {
        status: "blocked",
        code: "invalid_submit_payload",
        message: "Submit payload failed validation."
      },
      { status: 400, headers: NO_STORE_HEADERS }
    );
  }

  const adapter = createLiveClobTradingAdapter();
  const result = await adapter.submitSignedOrder(parsed.data);
  const responseStatus =
    result.status === "submitted" ? 200 : result.status === "blocked" ? 403 : 502;

  return NextResponse.json(result, {
    headers: NO_STORE_HEADERS,
    status: responseStatus
  });
}
