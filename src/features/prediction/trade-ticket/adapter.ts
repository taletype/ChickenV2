import type {
  PredictionMarketCardViewModel,
  PredictionTradeReadinessCheck,
  PredictionTradeTicketViewModel
} from "../types";
import { getPolymarketLiveTradingConfig } from "@/lib/polymarket/liveTradingReadiness";
import type { LiveTopUpFundingSnapshot } from "@/lib/polymarket/live-topup-status";

function resolveTicketFunding(funding?: LiveTopUpFundingSnapshot | null): PredictionTradeTicketViewModel["funding"] {
  const depositWalletKnown = funding?.depositWallet.status === "available";
  const depositWalletDeployed =
    funding?.depositWallet.status === "available" && funding.depositWallet.deployed === true;
  const pusdBalanceReal = funding?.balances.depositWalletPusd.status === "available";
  const clobBalanceReal = funding?.balances.clob.status === "available";
  const clobBalanceReady =
    funding?.balances.clob.status === "available" && funding.balances.clob.balanceReady;
  const clobAllowanceReady =
    funding?.balances.clob.status === "available" && funding.balances.clob.allowanceReady;
  const l2CredentialsAvailable = clobBalanceReal;

  if (funding?.readiness.topUpReady) {
    return {
      status: "ready",
      step: "ready",
      topUpReady: true,
      canSubmitLiveOrder: funding.readiness.canSubmitLiveOrder,
      depositWalletKnown,
      depositWalletDeployed,
      pusdBalanceReal,
      clobBalanceReal,
      clobBalanceReady,
      clobAllowanceReady,
      l2CredentialsAvailable
    };
  }

  return {
    status: "blocked",
    step: funding?.readiness.step ?? "connect_wallet",
    topUpReady: false,
    canSubmitLiveOrder: false,
    depositWalletKnown,
    depositWalletDeployed,
    pusdBalanceReal,
    clobBalanceReal,
    clobBalanceReady,
    clobAllowanceReady,
    l2CredentialsAvailable
  };
}

function state(value: boolean, unavailable = false) {
  if (unavailable) {
    return "unavailable" as const;
  }
  return value ? ("ready" as const) : ("blocked" as const);
}

function buildReadinessChecks(input: {
  funding: PredictionTradeTicketViewModel["funding"];
  liveTradingEnabled: boolean;
  market: PredictionMarketCardViewModel | null;
  selectedTokenId: string | null;
  submitAdapterConfigured: boolean;
}): PredictionTradeReadinessCheck[] {
  const marketTradable = Boolean(input.market?.tradable);
  const tokenValid = Boolean(
    input.selectedTokenId &&
      input.market?.outcomes.some((outcome) => outcome.tokenId === input.selectedTokenId)
  );

  return [
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
      state: state(marketTradable, !input.market),
      detail: marketTradable ? "Canonical market is tradable." : "Market is not tradable."
    },
    {
      id: "token_outcome_valid",
      label: "Token/outcome valid",
      state: state(tokenValid, !input.selectedTokenId),
      detail: tokenValid ? "Selected token belongs to the market." : "Select a valid outcome token."
    },
    {
      id: "deposit_wallet_known_deployed",
      label: "Deposit wallet known/deployed",
      state: state(input.funding.depositWalletKnown && input.funding.depositWalletDeployed),
      detail:
        input.funding.depositWalletKnown && input.funding.depositWalletDeployed
          ? "Deposit wallet deployment is confirmed."
          : "Deposit wallet deployment is not confirmed."
    },
    {
      id: "pusd_balance_real",
      label: "pUSD balance real",
      state: state(input.funding.pusdBalanceReal),
      detail: input.funding.pusdBalanceReal
        ? "Deposit wallet pUSD came from a real balance check."
        : "No real deposit wallet pUSD balance is available."
    },
    {
      id: "clob_balance_real",
      label: "CLOB balance real",
      state: state(input.funding.clobBalanceReal && input.funding.clobBalanceReady),
      detail:
        input.funding.clobBalanceReal && input.funding.clobBalanceReady
          ? "CLOB collateral balance is synced and sufficient."
          : "CLOB collateral balance is unavailable or insufficient."
    },
    {
      id: "clob_allowance_ready",
      label: "CLOB allowance ready",
      state: state(input.funding.clobAllowanceReady),
      detail: input.funding.clobAllowanceReady
        ? "CLOB collateral allowance is ready."
        : "Exact CLOB allowance is not ready."
    },
    {
      id: "l2_credentials_available",
      label: "L2 credentials available",
      state: state(input.funding.l2CredentialsAvailable),
      detail: input.funding.l2CredentialsAvailable
        ? "CLOB credential-backed balance checks are available."
        : "CLOB credentials are missing or unavailable."
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
      state: state(input.liveTradingEnabled),
      detail: input.liveTradingEnabled
        ? "Live trading prepare gates are enabled."
        : "Live trading prepare gates are disabled."
    },
    {
      id: "submit_adapter_configured",
      label: "Submit adapter configured",
      state: state(input.submitAdapterConfigured),
      detail: input.submitAdapterConfigured
        ? "Signed submit adapter is configured."
        : "signed_submit_adapter_not_configured"
    }
  ];
}

export function buildTradeTicketViewModel(options: {
  market: PredictionMarketCardViewModel | null;
  selectedTokenId?: string | null;
  funding?: LiveTopUpFundingSnapshot | null;
}): PredictionTradeTicketViewModel {
  const funding = resolveTicketFunding(options.funding);
  const liveConfig = getPolymarketLiveTradingConfig();
  const liveTradingEnabled =
    liveConfig.publicLiveEnabled &&
    liveConfig.liveSubmitEnabled &&
    liveConfig.operatorConfirmed &&
    liveConfig.signerHealthy &&
    !liveConfig.killSwitchActive;
  const submitAdapterConfigured = false;
  const readiness = {
    checks: buildReadinessChecks({
      funding,
      liveTradingEnabled,
      market: options.market,
      selectedTokenId: options.selectedTokenId ?? null,
      submitAdapterConfigured
    }),
    liveTradingEnabled,
    submitAdapterConfigured
  };

  if (!options.market || !options.market.tradable) {
    return {
      status: "disabled",
      marketSlug: options.market?.slug ?? "",
      selectedOutcome: null,
      selectedTokenId: null,
      side: "BUY",
      price: null,
      size: null,
      disabledReason: "market_not_tradable",
      readiness,
      funding
    };
  }

  const selected =
    options.market.outcomes.find(
      (outcome) => outcome.tokenId === options.selectedTokenId
    ) ??
    options.market.outcomes.find((outcome) => outcome.tokenId) ??
    null;

  const fundingDisabledReason = !funding.topUpReady
    ? funding.step
    : funding.canSubmitLiveOrder
      ? null
      : "live_top_up_disabled";

  return {
    status: selected?.tokenId && !fundingDisabledReason ? "ready" : "disabled",
    marketSlug: options.market.slug,
    selectedOutcome: selected?.label ?? null,
    selectedTokenId: selected?.tokenId ?? null,
    side: "BUY",
    price: selected?.price ?? null,
    size: null,
    disabledReason: selected?.tokenId ? fundingDisabledReason : "missing_token_id",
    readiness: {
      ...readiness,
      checks: buildReadinessChecks({
        funding,
        liveTradingEnabled,
        market: options.market,
        selectedTokenId: selected?.tokenId ?? null,
        submitAdapterConfigured
      })
    },
    funding
  };
}
