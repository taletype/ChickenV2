import { afterEach, describe, expect, it, vi } from "vitest";
import { listPolymarketMarkets } from "@/lib/polymarket/markets";
import { clearMarketCache } from "@/lib/polymarket/market-cache";

describe("polymarket market reads", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    clearMarketCache();
  });

  it("normalizes live feed responses", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        Response.json([
          {
            id: "1",
            slug: "slug",
            question: "Question?",
            outcomes: ["Yes", "No"],
            outcomePrices: [0.4, 0.6],
            clobTokenIds: ["1", "2"],
            active: true
          }
        ])
      )
    );

    const result = await listPolymarketMarkets({ cacheStrategy: "no-cache" });

    expect(result.ok).toBe(true);
    expect(result.data[0]?.slug).toBe("slug");
  });

  it("returns unavailable instead of fallback records on upstream failure", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response("bad", { status: 503 }))
    );

    const result = await listPolymarketMarkets({ cacheStrategy: "no-cache" });

    expect(result.ok).toBe(false);
    expect(result.data).toEqual([]);
  });
});
