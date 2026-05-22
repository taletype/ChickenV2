import { NextResponse } from "next/server";
import { createLiveClobTradingAdapter } from "@/lib/polymarket/adapters/live-clob-adapter";
import { validatePolymarketOrderIntent } from "@/lib/polymarket/order-validation";
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
      { status: 400 }
    );
  }

  const validation = validatePolymarketOrderIntent(parsed.data.intent);

  if (!validation.ok) {
    return NextResponse.json(
      {
        status: "blocked",
        code: validation.code,
        message: validation.message
      },
      { status: 403 }
    );
  }

  const adapter = createLiveClobTradingAdapter();
  const result = await adapter.submitSignedOrder(parsed.data.signedOrder);

  return NextResponse.json(result, {
    status: result.status === "submitted" ? 200 : 403
  });
}
