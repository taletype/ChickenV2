import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { TradeTicket } from "@/components/prediction-ui/trade-ticket/trade-ticket";
import { buildTradeTicketViewModel } from "@/features/prediction/trade-ticket/adapter";
import type { PredictionMarketCardViewModel } from "@/features/prediction/types";
import { resolveFundingStateModel } from "@/lib/polymarket/funding-readiness-state-machine";
import type { LiveTopUpFundingSnapshot } from "@/lib/polymarket/live-topup-status";

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
    expect(screen.getByText("Fail-closed")).toBeInTheDocument();
    expect(screen.getAllByText("Connect a wallet before trading.").length).toBeGreaterThan(0);
  });
});
