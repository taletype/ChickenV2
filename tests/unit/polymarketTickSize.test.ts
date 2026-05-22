import { describe, expect, it } from "vitest";
import {
  isPriceAlignedToTick,
  snapPriceToPolymarketTick
} from "@/lib/polymarket/tick-size";

describe("polymarket tick size", () => {
  it("snaps prices to canonical ticks", () => {
    expect(snapPriceToPolymarketTick(0.503, 0.01)).toBe(0.5);
    expect(isPriceAlignedToTick(0.5, 0.01)).toBe(true);
    expect(isPriceAlignedToTick(0.503, 0.01)).toBe(false);
  });
});
