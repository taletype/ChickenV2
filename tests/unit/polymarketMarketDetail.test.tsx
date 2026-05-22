import { afterEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { MarketDetailLayout } from "@/components/prediction-ui/market-detail-layout";
import type { PredictionChartViewModel } from "@/features/prediction/types";
import { buildMarketDetailViewModel } from "@/features/prediction/market-detail/adapter";
import { clearMarketCache } from "@/lib/polymarket/market-cache";

vi.mock("@/hooks/use-wallet-connection-state", () => ({
  useWalletConnectionState: () => ({
    status: "disconnected",
    address: null,
    chainId: null,
    expectedChainId: 137,
    label: null,
    reason: null
  })
}));

vi.mock("wagmi", () => ({
  useWalletClient: () => ({ data: null })
}));

describe("market detail adapter", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    clearMarketCache();
  });

  it("returns unavailable when slug is not found", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => Response.json([])));

    const vm = await buildMarketDetailViewModel({ locale: "en", slug: "missing" });

    expect(vm.status).toBe("unavailable");
    expect(vm.market).toBeNull();
    expect(vm.metadata).toBeNull();
  });

  it("renders real adapter data through the detail page", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        Response.json([
          {
            id: "1",
            conditionId: "0xcondition",
            slug: "adapter-market",
            question: "Will detail page use adapter data?",
            description: "Rules text from Gamma",
            category: "Politics",
            image: "https://example.com/market.png",
            outcomes: ["Yes", "No"],
            outcomePrices: [0.64, 0.36],
            clobTokenIds: ["yes-token", "no-token"],
            volume24hr: 1234.5,
            liquidity: 678.9,
            minimumOrderSize: 5,
            minimumTickSize: 0.01,
            createdAt: "2026-05-20T00:00:00.000Z",
            updatedAt: "2026-05-21T00:00:00.000Z",
            endDate: "2026-06-01T00:00:00.000Z",
            resolutionSource: "Official source",
            resolutionSourceUrl: "https://example.com/resolution",
            active: true
          }
        ])
      )
    );
    const chart: PredictionChartViewModel = {
      status: "empty",
      points: [],
      latestPrice: null,
      error: null
    };

    const detail = await buildMarketDetailViewModel({
      locale: "en",
      slug: "adapter-market"
    });

    expect(detail.status).toBe("ready");
    expect(detail.market?.question).toBe("Will detail page use adapter data?");
    expect(detail.metadata?.conditionId).toBe("0xcondition");

    render(
      <MarketDetailLayout
        detail={detail}
        chart={chart}
        ticket={{
          status: "disabled",
          marketSlug: "adapter-market",
          selectedOutcome: "Yes",
          selectedTokenId: "yes-token",
          side: "BUY",
          price: 0.64,
          size: null,
          disabledReason: "connect_wallet",
          readiness: {
            checks: [],
            liveTradingEnabled: false,
            submitAdapterConfigured: false
          },
          funding: {
            status: "blocked",
            step: "connect_wallet",
            topUpReady: false,
            canSubmitLiveOrder: false,
            depositWalletKnown: false,
            depositWalletDeployed: false,
            pusdBalanceReal: false,
            clobBalanceReal: false,
            clobBalanceReady: false,
            clobAllowanceReady: false,
            l2CredentialsAvailable: false
          }
        }}
        locale="en"
      />
    );

    expect(screen.getAllByText("Will detail page use adapter data?").length).toBeGreaterThan(0);
    expect(screen.getByText("Rules text from Gamma")).toBeInTheDocument();
    expect(screen.getAllByText("Token available").length).toBe(2);
    expect(screen.getByRole("button", { name: "Discussion" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Activity" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Open orders" })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Discussion" }));

    expect(screen.getByText("Discussion unavailable")).toBeInTheDocument();
    expect(screen.getByText("V2 has not connected a server-owned discussion backend for this market.")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Activity" }));

    expect(screen.getByText("Market activity unavailable")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Open orders" }));

    expect(screen.getByText("Open orders unavailable")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Market details" }));

    expect(screen.getByText("2 of 2 available")).toBeInTheDocument();
    expect(screen.getByText("Condition ID")).toBeInTheDocument();
    expect(screen.getByText("0xcondition")).toBeInTheDocument();
  });
});
