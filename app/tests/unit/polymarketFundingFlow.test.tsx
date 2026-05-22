import { render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { FundingPanelContent } from "@/components/prediction-ui/funding/funding-panel";
import { buildFundingPanelViewModel } from "@/features/prediction/funding/adapter";
import { getAppKitReadiness, resolveWalletConnectionState } from "@/lib/wallet/appkit";

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

describe("funding flow adapter", () => {
  it("does not claim withdrawal success without a signed transaction path", async () => {
    const vm = await buildFundingPanelViewModel();

    expect(vm.withdraw.status).toBe("unsupported_withdrawal_path");
  });

  it("does not invent top-up readiness without a connected wallet", async () => {
    const vm = await buildFundingPanelViewModel();

    expect(vm.liveTopUp.readiness.topUpReady).toBe(false);
    expect(vm.liveTopUp.depositWallet.status).toBe("unavailable");
  });

  it("renders the disconnected wallet funding state without fake balances", async () => {
    const vm = await buildFundingPanelViewModel();
    const walletState = resolveWalletConnectionState({
      readiness: getAppKitReadiness("project"),
      connected: false
    });

    render(<FundingPanelContent funding={vm} walletState={walletState} />);

    expect(screen.getByText("No wallet connected")).toBeInTheDocument();
    expect(screen.getAllByText("missing_wallet").length).toBeGreaterThan(0);
    expect(screen.queryByText("0.00 pUSD")).not.toBeInTheDocument();
  });

  it("renders the connected wallet dry-run state with a deterministic deposit wallet", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: false })
    );
    const vm = await buildFundingPanelViewModel(owner);
    const walletState = resolveWalletConnectionState({
      readiness: getAppKitReadiness("project"),
      address: owner,
      chainId: 137,
      connected: true
    });

    render(<FundingPanelContent funding={vm} walletState={walletState} />);

    expect(screen.getByText("Connected 0x0000...beef")).toBeInTheDocument();
    expect(vm.liveTopUp.depositWallet.status).toBe("available");
    if (vm.liveTopUp.depositWallet.status === "available") {
      expect(
        screen.getByText(vm.liveTopUp.depositWallet.depositWalletAddress)
      ).toBeInTheDocument();
    }
    expect(screen.getByText("Unknown")).toBeInTheDocument();
    expect(screen.getByText("Submit disabled: live top-up gates are closed")).toBeInTheDocument();
  });

  it("renders wrong-chain state and keeps top-up disabled", async () => {
    const vm = await buildFundingPanelViewModel(owner);
    const walletState = resolveWalletConnectionState({
      readiness: getAppKitReadiness("project"),
      address: owner,
      chainId: 1,
      connected: true
    });

    render(<FundingPanelContent funding={vm} walletState={walletState} />);

    expect(screen.getByText("Wrong network: switch to Polygon")).toBeInTheDocument();
    expect(screen.getByText("Submit disabled: live top-up gates are closed")).toBeInTheDocument();
  });
});
