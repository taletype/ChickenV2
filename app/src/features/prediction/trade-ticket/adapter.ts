import type {
  PredictionMarketCardViewModel,
  PredictionTradeTicketViewModel
} from "../types";
import type { LiveTopUpFundingSnapshot } from "@/lib/polymarket/live-topup-status";

function resolveTicketFunding(funding?: LiveTopUpFundingSnapshot | null): PredictionTradeTicketViewModel["funding"] {
  if (funding?.readiness.topUpReady) {
    return {
      status: "ready",
      step: "ready",
      topUpReady: true,
      canSubmitLiveOrder: funding.readiness.canSubmitLiveOrder
    };
  }

  return {
    status: "blocked",
    step: funding?.readiness.step ?? "connect_wallet",
    topUpReady: false,
    canSubmitLiveOrder: false
  };
}

export function buildTradeTicketViewModel(options: {
  market: PredictionMarketCardViewModel | null;
  selectedTokenId?: string | null;
  funding?: LiveTopUpFundingSnapshot | null;
}): PredictionTradeTicketViewModel {
  const funding = resolveTicketFunding(options.funding);

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
    funding
  };
}
