import "server-only";
import type { TradingAdapter } from "./trading-adapter";
import { submitViaSdkFirstAdapter } from "../sdk-first";

export function createLiveClobTradingAdapter(): TradingAdapter {
  return {
    submitSignedOrder: submitViaSdkFirstAdapter
  };
}
