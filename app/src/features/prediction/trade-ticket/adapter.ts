import type {
  PredictionMarketCardViewModel,
  PredictionTradeTicketViewModel
} from "../types";

export function buildTradeTicketViewModel(options: {
  market: PredictionMarketCardViewModel | null;
  selectedTokenId?: string | null;
}): PredictionTradeTicketViewModel {
  if (!options.market || !options.market.tradable) {
    return {
      status: "disabled",
      marketSlug: options.market?.slug ?? "",
      selectedOutcome: null,
      selectedTokenId: null,
      side: "BUY",
      price: null,
      size: null,
      disabledReason: "market_not_tradable"
    };
  }

  const selected =
    options.market.outcomes.find(
      (outcome) => outcome.tokenId === options.selectedTokenId
    ) ??
    options.market.outcomes.find((outcome) => outcome.tokenId) ??
    null;

  return {
    status: selected?.tokenId ? "ready" : "disabled",
    marketSlug: options.market.slug,
    selectedOutcome: selected?.label ?? null,
    selectedTokenId: selected?.tokenId ?? null,
    side: "BUY",
    price: selected?.price ?? null,
    size: null,
    disabledReason: selected?.tokenId ? null : "missing_token_id"
  };
}
