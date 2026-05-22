export type SubmitSignedOrderClientResult =
  | {
      status: "submitted";
      orderId: string;
    }
  | {
      status: "blocked" | "failed";
      code: string;
      message: string;
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
