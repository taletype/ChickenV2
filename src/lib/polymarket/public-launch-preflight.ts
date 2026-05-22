import "server-only";
import { getLiveTradingReadiness } from "./liveTradingReadiness";

export function runPublicLaunchPreflight() {
  const liveTrading = getLiveTradingReadiness();

  return {
    marketReads: "enabled" as const,
    walletReads: "enabled" as const,
    liveTrading
  };
}
