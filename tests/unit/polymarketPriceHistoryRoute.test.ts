import { describe, expect, it } from "vitest";
import { normalizePriceHistory } from "@/lib/polymarket/markets";

describe("price history normalization", () => {
  it("normalizes CLOB history points", () => {
    expect(
      normalizePriceHistory({
        history: [
          { t: 2, p: 0.6 },
          { t: 1, p: 0.5 }
        ]
      })
    ).toEqual([
      { timestamp: 1, price: 0.5 },
      { timestamp: 2, price: 0.6 }
    ]);
  });
});
