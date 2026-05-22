import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { FundingPanelContent } from "@/components/prediction-ui/funding/funding-panel";
import { buildFundingPanelViewModel } from "@/features/prediction/funding/adapter";
import { buildDepositWalletApprovalPreview } from "@/lib/polymarket/deposit-wallet-approval";
import { getAppKitReadiness, resolveWalletConnectionState } from "@/lib/wallet/appkit";

const wagmiMock = vi.hoisted(() => ({
  walletClient: null as null | {
    signTypedData: (input: unknown) => Promise<`0x${string}`>;
  }
}));

vi.mock("wagmi", async (importOriginal) => {
  const actual = await importOriginal<typeof import("wagmi")>();

  return {
    ...actual,
    useWalletClient: () => ({ data: wagmiMock.walletClient })
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

beforeEach(() => {
  wagmiMock.walletClient = null;
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

  it("signs and submits an exact approval only in the approval-required state", async () => {
    const signature = `0x${"1".repeat(130)}` as `0x${string}`;
    const signTypedData = vi.fn().mockResolvedValue(signature);
    wagmiMock.walletClient = { signTypedData };
    const vm = await buildFundingPanelViewModel(owner);
    const approvalPreview = buildDepositWalletApprovalPreview({
      ownerAddress: owner,
      amountBaseUnits: "1000000"
    });
    expect(approvalPreview.status).toBe("ready");
    if (approvalPreview.status !== "ready") {
      throw new Error("approval preview must be ready for this test");
    }
    const plan = {
      status: "ready" as const,
      ownerAddress: owner,
      depositWalletAddress: approvalPreview.depositWalletAddress,
      amountBaseUnits: approvalPreview.amountBaseUnits,
      spenderAddress: approvalPreview.spenderAddress,
      tokenAddress: approvalPreview.tokenAddress,
      nonce: "1",
      deadline: "9999999999",
      calls: approvalPreview.calls,
      typedData: {
        domain: {
          name: "DepositWallet" as const,
          version: "1" as const,
          chainId: 137 as const,
          verifyingContract: approvalPreview.depositWalletAddress
        },
        types: {
          Call: [
            { name: "target" as const, type: "address" },
            { name: "value" as const, type: "uint256" },
            { name: "data" as const, type: "bytes" }
          ],
          Batch: [
            { name: "wallet" as const, type: "address" },
            { name: "nonce" as const, type: "uint256" },
            { name: "deadline" as const, type: "uint256" },
            { name: "calls" as const, type: "Call[]" }
          ]
        },
        primaryType: "Batch" as const,
        message: {
          wallet: approvalPreview.depositWalletAddress,
          nonce: "1",
          deadline: "9999999999",
          calls: approvalPreview.calls
        }
      }
    };
    let submittedBody: Record<string, unknown> | null = null;
    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
        const url = String(input);
        if (url.includes("/deposit-wallet/status")) {
          return Response.json(vm.liveTopUp);
        }
        if (url.includes("/approval-plan")) {
          return Response.json(plan);
        }
        if (url.includes("/approval-submit")) {
          submittedBody = JSON.parse(String(init?.body));
          return Response.json({
            status: "submitted",
            transactionID: "tx_123",
            state: "STATE_PENDING"
          });
        }
        return Response.json({ status: "blocked", code: "unexpected_request" }, { status: 404 });
      })
    );
    const walletState = resolveWalletConnectionState({
      readiness: getAppKitReadiness("project"),
      address: owner,
      chainId: 137,
      connected: true
    });
    const readyVm = {
      ...vm,
      liveTopUp: {
        ...vm.liveTopUp,
        env: {
          status: "ready" as const,
          enabled: true,
          killSwitchActive: false,
          configured: true,
          reason: "ready" as const,
          missing: [],
          invalid: []
        },
        approvalPreview,
        readiness: {
          ...vm.liveTopUp.readiness,
          step: "approval_required" as const,
          topUpReady: false,
          canSubmitLiveOrder: false,
          checklist: vm.liveTopUp.readiness.checklist.map((item) =>
            item.id === "live_top_up_gate" ? { ...item, state: "ready" as const } : item
          )
        }
      }
    };

    render(<FundingPanelContent funding={readyVm} walletState={walletState} />);

    const approvalButton = screen.getByRole("button", {
      name: "Sign exact approval"
    });
    expect(approvalButton).toBeEnabled();

    fireEvent.click(approvalButton);

    await waitFor(() => expect(signTypedData).toHaveBeenCalledWith(
      expect.objectContaining({
        account: owner,
        primaryType: "Batch"
      })
    ));
    await screen.findByText("Approval submitted");
    expect(submittedBody).toMatchObject({
      ownerAddress: owner,
      signature,
      amountBaseUnits: "1000000",
      calls: approvalPreview.calls
    });
  });
});
