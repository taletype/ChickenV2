import { describe, expect, it } from "vitest";
import { normalizePolymarketMarket } from "@/lib/polymarket/normalize";

describe("polymarket normalization", () => {
  it("normalizes Gamma market JSON arrays", () => {
    const market = normalizePolymarketMarket({
      id: "1",
      slug: "will-it-rain",
      question: "Will it rain?",
      outcomes: "[\"Yes\",\"No\"]",
      outcomePrices: "[\"0.42\",\"0.58\"]",
      clobTokenIds: "[\"yes-token\",\"no-token\"]",
      active: true
    });

    expect(market?.outcomes).toHaveLength(2);
    expect(market?.outcomes[0]).toMatchObject({
      label: "Yes",
      price: 0.42,
      tokenId: "yes-token"
    });
  });

  it("returns null when required market identity is absent", () => {
    expect(normalizePolymarketMarket({ id: "1" })).toBeNull();
  });
});
