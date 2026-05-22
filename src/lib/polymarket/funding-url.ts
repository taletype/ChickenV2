import { getServerEnv } from "@/lib/env/server-env";

export function buildOfficialPolymarketFundingUrl() {
  return getServerEnv().POLYMARKET_OFFICIAL_FUNDING_URL;
}
