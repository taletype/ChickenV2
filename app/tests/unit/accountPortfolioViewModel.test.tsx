import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { PortfolioViewContent } from "@/components/prediction-ui/portfolio/portfolio-view";
import { buildFundingPanelViewModel } from "@/features/prediction/funding/adapter";
import { buildPortfolioViewModel } from "@/features/prediction/portfolio/adapter";
import type { PredictionPortfolioViewModel } from "@/features/prediction/types";
import { getAppKitReadiness, resolveWalletConnectionState } from "@/lib/wallet/appkit";

vi.mock("wagmi", async (importOriginal) => {
  const actual = await importOriginal<typeof import("wagmi")>();

  return {
    ...actual,
    useWalletClient: () => ({ data: null })
  };
});

const owner = "0x000000000000000000000000000000000000beef";
const liveTopUpEnvKeys = [
  "POLYMARKET_LIVE_TOP_UP_ENABLED",
  "RELAYER_URL",
  "POLYGON_RPC_URL",
  "CLOB_API_KEY",
  "CLOB_SECRET",
  "CLOB_PASS_PHRASE",
  "CLOB_API_URL"
] as const;
let previousEnv: Record<string, string | undefined> = {};

function readyEmptyPortfolio(): PredictionPortfolioViewModel {
  return {
    status: "ready",
    addressLabel: "0x0000...beef",
    positions: [],
    fills: [],
    pnl: {
      status: "available",
      totalCurrentValue: 0
    },
    error: null
  };
}

beforeEach(() => {
  previousEnv = Object.fromEntries(
    liveTopUpEnvKeys.map((key) => [key, process.env[key]])
  );
  process.env.POLYMARKET_LIVE_TOP_UP_ENABLED = "false";
  for (const key of liveTopUpEnvKeys.filter((key) => key !== "POLYMARKET_LIVE_TOP_UP_ENABLED")) {
    delete process.env[key];
  }
});

afterEach(() => {
  vi.unstubAllGlobals();
  for (const key of liveTopUpEnvKeys) {
    const value = previousEnv[key];
    if (value === undefined) {
      delete process.env[key];
    } else {
      process.env[key] = value;
    }
  }
});

describe("account portfolio view model", () => {
  it("does not synthesize positions for disconnected wallets", async () => {
    const vm = await buildPortfolioViewModel({});

    expect(vm.status).toBe("disconnected");
    expect(vm.positions).toEqual([]);
    expect(vm.fills).toEqual([]);
    expect(vm.pnl.status).toBe("unavailable");
  });
});

describe("portfolio account shell", () => {
  it("renders disconnected state without balances, positions, fills, or orders", async () => {
    const portfolio = await buildPortfolioViewModel({});
    const funding = await buildFundingPanelViewModel();
    const walletState = resolveWalletConnectionState({
      readiness: getAppKitReadiness("project"),
      connected: false
    });

    render(
      <PortfolioViewContent
        portfolio={portfolio}
        funding={funding}
        walletState={walletState}
      />
    );

    expect(screen.getAllByText("Connect wallet").length).toBeGreaterThan(0);
    expect(screen.getByText("No wallet session is active, so balances, positions, fills, and orders are not displayed.")).toBeInTheDocument();
    expect(screen.getByText("Connect wallet to view real data")).toBeInTheDocument();
    expect(screen.queryByText("$1,000.00")).not.toBeInTheDocument();
    expect(screen.queryByText("Open order #1")).not.toBeInTheDocument();
  });

  it("renders connected portfolio shell with honest empty positions, fills, and open orders", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(Response.json({ status: "blocked" })));
    const funding = await buildFundingPanelViewModel(owner);
    const walletState = resolveWalletConnectionState({
      readiness: getAppKitReadiness("project"),
      address: owner,
      chainId: 137,
      connected: true
    });

    render(
      <PortfolioViewContent
        portfolio={readyEmptyPortfolio()}
        funding={funding}
        walletState={walletState}
      />
    );

    expect(screen.getAllByText("$0.00").length).toBeGreaterThan(0);
    expect(screen.getByText("Account 0x0000...beef")).toBeInTheDocument();
    expect(screen.getByText("No real positions returned")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /Fills 0/i }));
    expect(screen.getByText("No real fills returned")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Open orders" }));
    expect(screen.getByText("No open orders loaded")).toBeInTheDocument();
    expect(screen.getByText("V2 has no real open-orders adapter wired here, so it does not display inferred orders.")).toBeInTheDocument();
  });

  it("renders wrong-chain portfolio and funding states without enabling top-up", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(Response.json({ status: "blocked" })));
    const funding = await buildFundingPanelViewModel(owner);
    const walletState = resolveWalletConnectionState({
      readiness: getAppKitReadiness("project"),
      address: owner,
      chainId: 1,
      connected: true
    });

    render(
      <PortfolioViewContent
        portfolio={readyEmptyPortfolio()}
        funding={funding}
        walletState={walletState}
      />
    );

    expect(screen.getAllByText("Wrong network: switch to Polygon").length).toBeGreaterThan(0);
    expect(screen.getByText("Wallet connected on the wrong network. Switch to Polygon before loading real account data.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Submit disabled: live top-up gates are closed" })).toBeDisabled();
  });
});
