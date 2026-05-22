import { describe, expect, it } from "vitest";
import { validatePolymarketOrderIntent } from "@/lib/polymarket/order-validation";

const validIntent = {
  tokenId: "token",
  marketSlug: "slug",
  outcome: "Yes",
  side: "BUY" as const,
  price: 0.5,
  size: 10,
  tickSize: 0.01,
  ownerAddress: "0x000000000000000000000000000000000000BEEF"
};

describe("order validation", () => {
  it("blocks live orders by default", () => {
    const result = validatePolymarketOrderIntent(validIntent);

    expect(result.ok).toBe(false);
    expect(result.ok ? null : result.code).toBe("live_trading_disabled");
  });

  it("checks tick alignment when live gate is bypassed for unit validation", () => {
    const result = validatePolymarketOrderIntent(
      { ...validIntent, price: 0.505 },
      { requireLiveGate: false }
    );

    expect(result.ok).toBe(false);
    expect(result.ok ? null : result.code).toBe("price_tick_mismatch");
  });
});
