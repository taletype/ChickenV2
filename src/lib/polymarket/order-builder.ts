import type { PolymarketOrderIntent } from "./order-validation";

export type PolymarketUnsignedOrder = {
  tokenID: string;
  price: number;
  size: number;
  side: "BUY" | "SELL";
  marketSlug: string;
};

export function buildPolymarketUnsignedOrder(
  intent: PolymarketOrderIntent
): PolymarketUnsignedOrder {
  return {
    tokenID: intent.tokenId,
    price: intent.price,
    size: intent.size,
    side: intent.side,
    marketSlug: intent.marketSlug
  };
}
