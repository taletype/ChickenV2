import type { DataFreshness, PolymarketPricePoint } from "@/lib/polymarket/types";
import type { PredictionFeedSort } from "./routes";

export type PredictionMarketCardViewModel = {
  id: string;
  slug: string;
  href: string;
  question: string;
  category: string | null;
  image: string | null;
  volume24hr: number | null;
  liquidity: number | null;
  bestOutcome: {
    label: string;
    price: number | null;
  } | null;
  outcomes: Array<{
    label: string;
    price: number | null;
    tokenId: string | null;
  }>;
  tradable: boolean;
  endDate: string | null;
  updatedAt: string | null;
};

export type PredictionMarketFeedViewModel = {
  status: "ready" | "empty" | "unavailable";
  markets: PredictionMarketCardViewModel[];
  freshness: DataFreshness;
  selectedCategory: string;
  selectedSearch: string;
  selectedSort: PredictionFeedSort;
  error: string | null;
};

export type PredictionMarketDetailViewModel = {
  status: "ready" | "unavailable";
  market: PredictionMarketCardViewModel | null;
  description: string | null;
  metadata: {
    conditionId: string | null;
    createdAt: string | null;
    updatedAt: string | null;
    endDate: string | null;
    volume24hr: number | null;
    liquidity: number | null;
    minimumOrderSize: number | null;
    tickSize: number;
    negRisk: boolean;
    resolutionSource: string | null;
    resolutionSourceUrl: string | null;
  } | null;
  discussion: PredictionDiscussionViewModel;
  activity: PredictionActivityViewModel;
  openOrders: PredictionOpenOrdersViewModel;
  freshness: DataFreshness;
  error: string | null;
};

export type PredictionChartViewModel = {
  status: "ready" | "empty" | "unavailable";
  points: PolymarketPricePoint[];
  latestPrice: number | null;
  error: string | null;
};

export type PredictionTradeTicketViewModel = {
  status: "disabled" | "ready";
  marketSlug: string;
  selectedOutcome: string | null;
  selectedTokenId: string | null;
  side: "BUY" | "SELL";
  price: number | null;
  size: number | null;
  disabledReason: string | null;
  funding:
    | {
        status: "ready";
        step: "ready";
        topUpReady: true;
        canSubmitLiveOrder: boolean;
      }
    | {
        status: "blocked";
        step: string;
        topUpReady: false;
        canSubmitLiveOrder: false;
      };
};

export type PredictionPortfolioViewModel = {
  status: "disconnected" | "ready" | "unavailable";
  addressLabel: string | null;
  positions: Array<{
    market: string;
    outcome: string;
    size: number;
    currentValue: number | null;
  }>;
  fills: Array<{
    market: string;
    side: string;
    outcome: string;
    price: number;
    size: number;
    timestamp: string | null;
  }>;
  pnl:
    | {
        status: "available";
        totalCurrentValue: number;
      }
    | {
        status: "unavailable";
        reason: string;
      };
  accountActivity: PredictionActivityViewModel;
  openOrders: PredictionOpenOrdersViewModel;
  error: string | null;
};

export type PredictionDiscussionReply = {
  id: string;
  authorLabel: string | null;
  authorAddress: string | null;
  body: string;
  createdAt: string | null;
  likesCount: number | null;
  viewerHasLiked: boolean | null;
};

export type PredictionDiscussionComment = {
  id: string;
  authorLabel: string | null;
  authorAddress: string | null;
  body: string;
  createdAt: string | null;
  likesCount: number | null;
  repliesCount: number | null;
  viewerHasLiked: boolean | null;
  canDelete: boolean;
  canReport: boolean;
  replies: PredictionDiscussionReply[];
};

export type PredictionDiscussionViewModel = {
  status: "unavailable" | "empty" | "ready";
  marketSlug: string;
  comments: PredictionDiscussionComment[];
  reason: string | null;
  error: string | null;
};

export type PredictionActivityRecord = {
  id: string;
  market: string | null;
  side: string | null;
  outcome: string | null;
  price: number | null;
  size: number | null;
  totalValue: number | null;
  timestamp: string | null;
  actorLabel: string | null;
  transactionUrl: string | null;
};

export type PredictionActivityViewModel = {
  status: "unavailable" | "empty" | "ready";
  scope: "market" | "account";
  records: PredictionActivityRecord[];
  reason: string | null;
  error: string | null;
};

export type PredictionOpenOrderRecord = {
  id: string;
  market: string | null;
  side: string | null;
  outcome: string | null;
  price: number | null;
  size: number | null;
  filledSize: number | null;
  expiration: string | null;
  status: string | null;
};

export type PredictionOpenOrdersViewModel = {
  status: "unavailable" | "empty" | "ready";
  scope: "market" | "account";
  orders: PredictionOpenOrderRecord[];
  reason: string | null;
  error: string | null;
};
