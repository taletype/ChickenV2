import { afterEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { buildMarketFeedViewModel } from "@/features/prediction/market-feed/adapter";
import { clearMarketCache } from "@/lib/polymarket/market-cache";
import { MarketGrid } from "@/components/prediction-ui/market-grid";

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
    expect(vm.markets[0]?.updatedAt).toBeNull();
    expect(vm.selectedSearch).toBe("");
    expect(vm.selectedSort).toBe("volume");
  });

  it("renders real adapter data through the feed grid", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        Response.json([
          {
            id: "1",
            slug: "real-market",
            question: "Will real adapter data render?",
            outcomes: ["Yes", "No"],
            outcomePrices: [0.62, 0.38],
            clobTokenIds: ["yes-token", "no-token"],
            volume24hr: 1234,
            active: true,
            updatedAt: "2026-05-20T00:00:00.000Z"
          }
        ])
      )
    );

    const vm = await buildMarketFeedViewModel({ locale: "en" });

    render(<MarketGrid markets={vm.markets} status={vm.status} error={vm.error} />);

    expect(screen.getByRole("article")).toBeInTheDocument();
    expect(screen.getByText("Will real adapter data render?")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Yes 62%/i })).toHaveAttribute(
      "href",
      "/en/polymarket/real-market?outcome=yes-token"
    );
  });

  it("filters and sorts only the live adapter records it receives", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        Response.json([
          {
            id: "1",
            slug: "old-crypto",
            question: "Old crypto market",
            outcomes: ["Yes", "No"],
            outcomePrices: [0.4, 0.6],
            clobTokenIds: ["1", "2"],
            liquidity: 20,
            active: true,
            updatedAt: "2026-05-18T00:00:00.000Z"
          },
          {
            id: "2",
            slug: "new-crypto",
            question: "New crypto market",
            outcomes: ["Yes", "No"],
            outcomePrices: [0.7, 0.3],
            clobTokenIds: ["3", "4"],
            liquidity: 10,
            active: true,
            updatedAt: "2026-05-21T00:00:00.000Z"
          },
          {
            id: "3",
            slug: "sports",
            question: "Sports market",
            outcomes: ["Yes", "No"],
            outcomePrices: [0.5, 0.5],
            clobTokenIds: ["5", "6"],
            liquidity: 100,
            active: true
          }
        ])
      )
    );

    const vm = await buildMarketFeedViewModel({
      locale: "en",
      search: "crypto",
      sort: "recent"
    });

    expect(vm.markets.map((market) => market.slug)).toEqual([
      "new-crypto",
      "old-crypto"
    ]);
    expect(vm.selectedSearch).toBe("crypto");
    expect(vm.selectedSort).toBe("recent");
  });
});
