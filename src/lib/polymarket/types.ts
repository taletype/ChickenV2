export type PolymarketOutcome = {
  label: string;
  tokenId: string | null;
  price: number | null;
  tradable: boolean;
};

export type PolymarketMarket = {
  id: string;
  conditionId: string | null;
  slug: string;
  question: string;
  description: string | null;
  category: string | null;
  image: string | null;
  volume24hr: number | null;
  liquidity: number | null;
  createdAt: string | null;
  endDate: string | null;
  active: boolean;
  closed: boolean;
  archived: boolean;
  negRisk: boolean;
  tickSize: number;
  minimumOrderSize: number | null;
  resolutionSource: string | null;
  resolutionSourceUrl: string | null;
  outcomes: PolymarketOutcome[];
  sourceUpdatedAt: string | null;
  fetchedAt: string;
};

export type PolymarketPricePoint = {
  timestamp: number;
  price: number;
};

export type DataFreshness = {
  fetchedAt: string;
  ageMs: number;
  stale: boolean;
  degraded: boolean;
  reason: string | null;
};

export type PolymarketReadResult<T> = {
  ok: boolean;
  data: T;
  freshness: DataFreshness;
  error: string | null;
  source: "gamma" | "clob" | "data-api" | "unavailable";
};

export type MarketCacheStrategy = "demand-refresh" | "hot-detail-refresh" | "no-cache";
