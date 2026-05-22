export type SubmitSignedOrderClientResult =
  | {
      status: "submitted";
      orderId: string;
      sdkStatus?: string;
      diagnostics?: Record<string, unknown>;
    }
  | {
      status: "blocked" | "failed";
      code: string;
      message: string;
      diagnostics?: Record<string, unknown>;
    };

export async function submitSignedPolymarketOrderClient(
  payload: unknown
): Promise<SubmitSignedOrderClientResult> {
  const response = await fetch("/api/polymarket/orders/submit", {
    method: "POST",
    headers: {
      "content-type": "application/json"
    },
    body: JSON.stringify(payload)
  });
  const json = (await response.json()) as SubmitSignedOrderClientResult;

  return json;
}
