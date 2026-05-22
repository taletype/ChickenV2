import type { SubmitSignedOrderClientResult } from "../submit-signed-order-client";
import type { SubmitSignedOrderRequest } from "../submit-signed-order-request";

export type TradingAdapter = {
  submitSignedOrder(
    request: SubmitSignedOrderRequest
  ): Promise<SubmitSignedOrderClientResult>;
};
