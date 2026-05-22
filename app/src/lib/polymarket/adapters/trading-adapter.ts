import type { SubmitSignedOrderClientResult } from "../submit-signed-order-client";

export type TradingAdapter = {
  submitSignedOrder(
    signedOrder: Record<string, unknown> | undefined
  ): Promise<SubmitSignedOrderClientResult>;
};
