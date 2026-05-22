import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { TradeTicket } from "@/components/prediction-ui/trade-ticket/trade-ticket";
import { buildTradeTicketViewModel } from "@/features/prediction/trade-ticket/adapter";
import type {
  PredictionMarketCardViewModel,
  PredictionTradeTicketViewModel
} from "@/features/prediction/types";
import { resolveFundingStateModel } from "@/lib/polymarket/funding-readiness-state-machine";
import type { LiveTopUpFundingSnapshot } from "@/lib/polymarket/live-topup-status";

const walletMock = vi.hoisted(() => ({
  state: {
    status: "disconnected",
    address: null,
    chainId: null,
    expectedChainId: 137,
    label: null,
    reason: null
  } as ReturnType<typeof import("@/hooks/use-wallet-connection-state").useWalletConnectionState>,
  walletClient: null as null | {
    signTypedData: (input: unknown) => Promise<`0x${string}`>;
  }
}));

vi.mock("@/hooks/use-wallet-connection-state", () => ({
  useWalletConnectionState: () => walletMock.state
}));

vi.mock("wagmi", () => ({
  useWalletClient: () => ({ data: walletMock.walletClient })
}));

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  walletMock.state = {
    status: "disconnected",
    address: null,
    chainId: null,
    expectedChainId: 137,
    label: null,
    reason: null
  };
  walletMock.walletClient = null;
});

function buildMarket(
  outcomes: PredictionMarketCardViewModel["outcomes"]
): PredictionMarketCardViewModel {
  return {
    id: "1",
    slug: "slug",
    href: "/zh/polymarket/slug",
    question: "Question?",
    category: null,
    image: null,
    volume24hr: null,
    liquidity: null,
    bestOutcome: null,
    outcomes,
    tradable: true,
    endDate: null,
    updatedAt: null
  };
}

function buildReadyTicket(
  market: PredictionMarketCardViewModel
): PredictionTradeTicketViewModel {
  return {
    status: "ready",
    marketSlug: market.slug,
    selectedOutcome: market.outcomes[0]?.label ?? null,
    selectedTokenId: market.outcomes[0]?.tokenId ?? null,
    side: "BUY",
    price: market.outcomes[0]?.price ?? null,
    size: null,
    disabledReason: null,
    readiness: {
      liveTradingEnabled: true,
      submitAdapterConfigured: false,
      checks: [
        {
          id: "wallet_connected",
          label: "Wallet connected",
          state: "unavailable",
          detail: "Checked in browser wallet state."
        },
        {
          id: "polygon_chain",
          label: "Supported Polygon chain",
          state: "unavailable",
          detail: "Checked in browser wallet state."
        },
        {
          id: "market_tradable",
          label: "Market tradable",
          state: "ready",
          detail: "Canonical market is tradable."
        },
        {
          id: "token_outcome_valid",
          label: "Token/outcome valid",
          state: "ready",
          detail: "Selected token belongs to the market."
        },
        {
          id: "deposit_wallet_known_deployed",
          label: "Deposit wallet known/deployed",
          state: "ready",
          detail: "Deposit wallet deployment is confirmed."
        },
        {
          id: "pusd_balance_real",
          label: "pUSD balance real",
          state: "ready",
          detail: "Deposit wallet pUSD came from a real balance check."
        },
        {
          id: "clob_balance_real",
          label: "CLOB balance real",
          state: "ready",
          detail: "CLOB collateral balance is synced and sufficient."
        },
        {
          id: "clob_allowance_ready",
          label: "CLOB allowance ready",
          state: "ready",
          detail: "CLOB collateral allowance is ready."
        },
        {
          id: "l2_credentials_available",
          label: "L2 credentials available",
          state: "ready",
          detail: "CLOB credential-backed balance checks are available."
        },
        {
          id: "signer_identity_valid",
          label: "Signer identity valid",
          state: "unavailable",
          detail: "Server prepare validates the signer identity."
        },
        {
          id: "live_trading_flag",
          label: "Live trading flag",
          state: "ready",
          detail: "Live trading prepare gates are enabled."
        },
        {
          id: "submit_adapter_configured",
          label: "Submit adapter configured",
          state: "blocked",
          detail: "signed_submit_adapter_not_configured"
        }
      ]
    },
    funding: {
      status: "ready",
      step: "ready",
      topUpReady: true,
      canSubmitLiveOrder: true,
      depositWalletKnown: true,
      depositWalletDeployed: true,
      pusdBalanceReal: true,
      clobBalanceReal: true,
      clobBalanceReady: true,
      clobAllowanceReady: true,
      l2CredentialsAvailable: true
    }
  };
}

describe("trade ticket adapter", () => {
  it("disables trading when token ids are unavailable", () => {
    const market = buildMarket([{ label: "Yes", price: null, tokenId: null }]);
    const vm = buildTradeTicketViewModel({
      market
    });

    expect(vm.status).toBe("disabled");
    expect(vm.disabledReason).toBe("missing_token_id");
  });

  it("blocks a tradable market until funding readiness is real", () => {
    const market = buildMarket([{ label: "Yes", price: 0.5, tokenId: "123" }]);
    const vm = buildTradeTicketViewModel({
      market
    });

    expect(vm.status).toBe("disabled");
    expect(vm.disabledReason).toBe("connect_wallet");
    expect(vm.funding.topUpReady).toBe(false);
  });

  it("does not treat connected-wallet pUSD as CLOB trade-ready collateral", () => {
    const market = buildMarket([{ label: "Yes", price: 0.5, tokenId: "123" }]);
    const funding = {
      account: {
        status: "connected",
        address: "0x000000000000000000000000000000000000beef",
        label: "0x0000...beef"
      },
      env: {
        status: "ready",
        enabled: true,
        killSwitchActive: false,
        configured: true,
        reason: "ready",
        missing: [],
        invalid: []
      },
      depositWallet: {
        status: "available",
        ownerAddress: "0x000000000000000000000000000000000000beef",
        depositWalletAddress: "0x000000000000000000000000000000000000cafe",
        depositWalletLabel: "0x0000...cafe",
        deployed: true,
        deployedStatus: "deployed",
        checkedAt: "2026-05-22T00:00:00.000Z",
        source: "rpc"
      },
      balances: {
        connectedWalletPusd: {
          status: "available",
          atoms: "5000000",
          formatted: "5",
          checkedAt: "2026-05-22T00:00:00.000Z"
        },
        depositWalletPusd: {
          status: "available",
          atoms: "5000000",
          formatted: "5",
          checkedAt: "2026-05-22T00:00:00.000Z"
        },
        clob: {
          status: "unavailable",
          asset: "COLLATERAL",
          balance: null,
          allowance: null,
          balanceReady: false,
          allowanceReady: false,
          checkedAt: "2026-05-22T00:00:00.000Z",
          reason: "missing_credentials"
        }
      },
      approvalPreview: {
        status: "blocked",
        code: "missing_wallet"
      },
      readiness: {
        step: "balance_allowance_unavailable",
        topUpReady: false,
        readyForLiveTopUp: false,
        canSubmitLiveOrder: false,
        stateModel: resolveFundingStateModel({
          walletConnected: true,
          walletChainSupported: true,
          depositWalletAvailable: true,
          depositWalletDeployed: true,
          pusdBalanceAvailable: true,
          pusdBalancePositive: true,
          clobBalanceAllowanceAvailable: false,
          clobBalanceReady: false,
          clobAllowanceReady: false,
          approvalPlanAvailable: false,
          liveTopUpEnabled: true,
          killSwitchActive: false
        }),
        checkedAt: "2026-05-22T00:00:00.000Z",
        checklist: []
      }
    } satisfies LiveTopUpFundingSnapshot;
    const vm = buildTradeTicketViewModel({ market, funding });

    expect(vm.status).toBe("disabled");
    expect(vm.disabledReason).toBe("balance_allowance_unavailable");
    expect(vm.funding.topUpReady).toBe(false);
    expect(vm.funding.canSubmitLiveOrder).toBe(false);
  });

  it("renders a blocked submit shell even when the market has a token", () => {
    const market = buildMarket([
      { label: "Yes", price: 0.5, tokenId: "yes-token" },
      { label: "No", price: 0.5, tokenId: "no-token" }
    ]);
    const ticket = buildTradeTicketViewModel({ market });

    render(<TradeTicket ticket={ticket} market={market} outcomes={market.outcomes} locale="en" />);

    expect(screen.getByRole("button", { name: /Submit blocked/i })).toBeDisabled();
    expect(screen.getByText("signed_submit_adapter_not_configured")).toBeInTheDocument();
    expect(screen.getAllByText("Connect a wallet before trading.").length).toBeGreaterThan(0);
  });

  it("renders disconnected readiness without enabling prepare controls", () => {
    const market = buildMarket([{ label: "Yes", price: 0.5, tokenId: "yes-token" }]);
    const ticket = buildReadyTicket(market);

    render(<TradeTicket ticket={ticket} market={market} outcomes={market.outcomes} locale="en" />);

    expect(screen.getByText("Wallet connected")).toBeInTheDocument();
    expect(screen.getAllByText("Connect a wallet before trading.").length).toBeGreaterThan(0);
    expect(screen.getByRole("button", { name: /Prepare signed order/i })).toBeDisabled();
  });

  it("renders wrong-chain readiness distinctly from disconnected state", () => {
    walletMock.state = {
      status: "unsupported_chain",
      address: "0x000000000000000000000000000000000000beef",
      chainId: 1,
      expectedChainId: 137,
      label: "0x0000...beef",
      reason: "unsupported_chain"
    };
    const market = buildMarket([{ label: "Yes", price: 0.5, tokenId: "yes-token" }]);
    const ticket = buildReadyTicket(market);

    render(<TradeTicket ticket={ticket} market={market} outcomes={market.outcomes} locale="en" />);

    expect(screen.getByText("Supported Polygon chain")).toBeInTheDocument();
    expect(screen.getAllByText("Switch to Polygon before trading.").length).toBeGreaterThan(0);
    expect(screen.getByRole("button", { name: /Prepare signed order/i })).toBeDisabled();
  });

  it("keeps prepare disabled when collateral is unavailable", () => {
    walletMock.state = {
      status: "connected",
      address: "0x000000000000000000000000000000000000beef",
      chainId: 137,
      expectedChainId: 137,
      label: "0x0000...beef",
      reason: null
    };
    const market = buildMarket([{ label: "Yes", price: 0.5, tokenId: "yes-token" }]);
    const ticket: PredictionTradeTicketViewModel = {
      ...buildReadyTicket(market),
      status: "disabled",
      disabledReason: "balance_allowance_unavailable",
      funding: {
        ...buildReadyTicket(market).funding,
        status: "blocked",
        step: "balance_allowance_unavailable",
        topUpReady: false,
        canSubmitLiveOrder: false,
        clobBalanceReal: false,
        clobBalanceReady: false,
        clobAllowanceReady: false,
        l2CredentialsAvailable: false
      }
    };

    render(<TradeTicket ticket={ticket} market={market} outcomes={market.outcomes} locale="en" />);
    fireEvent.change(screen.getByRole("textbox", { name: "Size" }), {
      target: { value: "10" }
    });
    fireEvent.click(screen.getByRole("checkbox"));

    expect(screen.getByText("Balance and allowance are unavailable.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Prepare signed order/i })).toBeDisabled();
  });

  it("surfaces signing unavailable without faking a signature", async () => {
    walletMock.state = {
      status: "connected",
      address: "0x000000000000000000000000000000000000beef",
      chainId: 137,
      expectedChainId: 137,
      label: "0x0000...beef",
      reason: null
    };
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        Response.json({
          status: "ready",
          order: {
            salt: "1",
            maker: walletMock.state.address,
            signer: walletMock.state.address,
            tokenId: "yes-token",
            makerAmount: "5000000",
            takerAmount: "10000000",
            side: "BUY",
            signatureType: 2,
            timestamp: "1",
            metadata: `0x${"0".repeat(64)}`,
            builder: `0x${"2".repeat(64)}`,
            expiration: "0"
          },
          orderType: "GTC",
          sdkSignatureSuffix: "",
          typedData: {
            domain: { name: "Polymarket CTF Exchange", version: "2", chainId: 137 },
            types: { Order: [{ name: "salt", type: "uint256" }] },
            primaryType: "Order",
            message: { salt: "1" }
          }
        })
      )
    );
    const market = buildMarket([{ label: "Yes", price: 0.5, tokenId: "yes-token" }]);
    const ticket = buildReadyTicket(market);

    render(<TradeTicket ticket={ticket} market={market} outcomes={market.outcomes} locale="en" />);
    fireEvent.change(screen.getByRole("textbox", { name: "Size" }), {
      target: { value: "10" }
    });
    fireEvent.click(screen.getByRole("checkbox"));
    fireEvent.click(screen.getByRole("button", { name: /Prepare signed order/i }));
    await waitFor(() => expect(screen.getByText("Order prepared for wallet signing.")).toBeInTheDocument());
    fireEvent.click(screen.getByRole("button", { name: /Sign with wallet/i }));

    expect(await screen.findByText("Wallet signing is unavailable in this session.")).toBeInTheDocument();
  });

  it("uses the wallet signTypedData seam when a real wallet client is available", async () => {
    const signTypedData = vi.fn().mockResolvedValue(`0x${"a".repeat(130)}`);
    walletMock.state = {
      status: "connected",
      address: "0x000000000000000000000000000000000000beef",
      chainId: 137,
      expectedChainId: 137,
      label: "0x0000...beef",
      reason: null
    };
    walletMock.walletClient = { signTypedData };
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        Response.json({
          status: "ready",
          order: {
            salt: "1",
            maker: walletMock.state.address,
            signer: walletMock.state.address,
            tokenId: "yes-token",
            makerAmount: "5000000",
            takerAmount: "10000000",
            side: "BUY",
            signatureType: 2,
            timestamp: "1",
            metadata: `0x${"0".repeat(64)}`,
            builder: `0x${"2".repeat(64)}`,
            expiration: "0"
          },
          orderType: "GTC",
          sdkSignatureSuffix: "",
          typedData: {
            domain: { name: "Polymarket CTF Exchange", version: "2", chainId: 137 },
            types: { Order: [{ name: "salt", type: "uint256" }] },
            primaryType: "Order",
            message: { salt: "1" }
          }
        })
      )
    );
    const market = buildMarket([{ label: "Yes", price: 0.5, tokenId: "yes-token" }]);
    const ticket = buildReadyTicket(market);

    render(<TradeTicket ticket={ticket} market={market} outcomes={market.outcomes} locale="en" />);
    fireEvent.change(screen.getByRole("textbox", { name: "Size" }), {
      target: { value: "10" }
    });
    fireEvent.click(screen.getByRole("checkbox"));
    fireEvent.click(screen.getByRole("button", { name: /Prepare signed order/i }));
    await waitFor(() => expect(screen.getByText("Order prepared for wallet signing.")).toBeInTheDocument());
    fireEvent.click(screen.getByRole("button", { name: /Sign with wallet/i }));

    await waitFor(() => expect(signTypedData).toHaveBeenCalledWith({
      account: walletMock.state.address,
      domain: { name: "Polymarket CTF Exchange", version: "2", chainId: 137 },
      types: { Order: [{ name: "salt", type: "uint256" }] },
      primaryType: "Order",
      message: { salt: "1" }
    }));
    expect(screen.getByText("Wallet signature captured; submit remains blocked.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Submit blocked/i })).toBeDisabled();
  });
});
