export const POLYMARKET_SUBMIT_PATHS = {
  sdkFirst: "sdk_first",
  blocked: "submit_blocked"
} as const;

export type PolymarketSubmitPath =
  (typeof POLYMARKET_SUBMIT_PATHS)[keyof typeof POLYMARKET_SUBMIT_PATHS];
