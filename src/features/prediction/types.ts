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

export type PredictionTradeReadinessState = "ready" | "blocked" | "unavailable";

export type PredictionTradeReadinessCheckId =
  | "wallet_connected"
  | "polygon_chain"
  | "market_tradable"
  | "token_outcome_valid"
  | "deposit_wallet_known_deployed"
  | "pusd_balance_real"
  | "clob_balance_real"
  | "clob_allowance_ready"
  | "l2_credentials_available"
  | "signer_identity_valid"
  | "live_trading_flag"
  | "submit_adapter_configured";

export type PredictionTradeReadinessCheck = {
  id: PredictionTradeReadinessCheckId;
  label: string;
  state: PredictionTradeReadinessState;
  detail: string;
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
  readiness: {
    checks: PredictionTradeReadinessCheck[];
    liveTradingEnabled: boolean;
    submitAdapterConfigured: boolean;
  };
  funding:
    | {
        status: "ready";
        step: "ready";
        topUpReady: true;
        canSubmitLiveOrder: boolean;
        depositWalletKnown: boolean;
        depositWalletDeployed: boolean;
        pusdBalanceReal: boolean;
        clobBalanceReal: boolean;
        clobBalanceReady: boolean;
        clobAllowanceReady: boolean;
        l2CredentialsAvailable: boolean;
      }
    | {
        status: "blocked";
        step: string;
        topUpReady: false;
        canSubmitLiveOrder: false;
        depositWalletKnown: boolean;
        depositWalletDeployed: boolean;
        pusdBalanceReal: boolean;
        clobBalanceReal: boolean;
        clobBalanceReady: boolean;
        clobAllowanceReady: boolean;
        l2CredentialsAvailable: boolean;
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

export type PredictionPublicProfileViewModel = {
  status: "unavailable" | "empty" | "ready";
  slug: string;
  displayLabel: string;
  positions: PredictionPortfolioViewModel["positions"];
  activity: PredictionActivityViewModel;
  reason: string | null;
  error: string | null;
};

export type PredictionLeaderboardRow = {
  id: string;
  rank: number;
  displayLabel: string;
  volume: number | null;
  pnl: number | null;
  marketsTraded: number | null;
};

export type PredictionLeaderboardViewModel = {
  status: "unavailable" | "empty" | "ready";
  rows: PredictionLeaderboardRow[];
  reason: string | null;
  error: string | null;
};

export type PredictionNotificationInboxViewModel = {
  status: "unavailable" | "empty" | "ready";
  notifications: Array<{
    id: string;
    title: string;
    body: string | null;
    href: string | null;
    createdAt: string | null;
    unread: boolean;
  }>;
  unreadCount: number | null;
  reason: string | null;
  error: string | null;
};
