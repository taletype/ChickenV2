import { afterEach, describe, expect, it, vi } from "vitest";
import { buildMarketFeedViewModel } from "@/features/prediction/market-feed/adapter";
import { clearMarketCache } from "@/lib/polymarket/market-cache";

describe("market feed adapter", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    clearMarketCache();
  });

  it("maps normalized markets into card view models", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        Response.json([
          {
            id: "1",
            slug: "slug",
            question: "Question?",
            outcomes: ["Yes", "No"],
            outcomePrices: [0.7, 0.3],
            clobTokenIds: ["yes", "no"],
            active: true
          }
        ])
      )
    );

    const vm = await buildMarketFeedViewModel({ locale: "zh" });

    expect(vm.status).toBe("ready");
    expect(vm.markets[0]?.href).toBe("/zh/polymarket/slug");
    expect(vm.markets[0]?.bestOutcome?.label).toBe("Yes");
  });
});
