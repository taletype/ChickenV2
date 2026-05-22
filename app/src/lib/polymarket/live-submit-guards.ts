import "server-only";
import {
  evaluatePolymarketLiveTradingReadiness,
  type LiveTradingBlockerCode,
  type LiveTradingReadiness,
  type LiveTradingReadinessInput
} from "./liveTradingReadiness";

export type LiveSubmitGuardResult =
  | {
      ok: true;
      readiness: Extract<LiveTradingReadiness, { status: "ready" }>;
    }
  | {
      ok: false;
      code: LiveTradingBlockerCode;
      message: string;
      readiness: Extract<LiveTradingReadiness, { status: "blocked" }>;
    };

export function assertLiveSubmitGuards(
  input: LiveTradingReadinessInput = {}
): LiveSubmitGuardResult {
  const liveTradingReadiness = evaluatePolymarketLiveTradingReadiness(input);

  if (liveTradingReadiness.status === "ready") {
    return { ok: true, readiness: liveTradingReadiness };
  }

  const firstBlocker = liveTradingReadiness.blockers[0] ?? {
    code: "invalid_order" as const,
    message: "Order failed server validation."
  };

  return {
    ok: false,
    code: firstBlocker.code,
    message: firstBlocker.message,
    readiness: liveTradingReadiness
  };
}
