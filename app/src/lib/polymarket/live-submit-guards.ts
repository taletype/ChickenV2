import "server-only";
import { getServerEnv } from "@/lib/env/server-env";

export type LiveSubmitGuardResult =
  | {
      ok: true;
    }
  | {
      ok: false;
      code:
        | "live_disabled"
        | "operator_confirmation_missing"
        | "builder_code_missing";
      message: string;
    };

export function assertLiveSubmitGuards(): LiveSubmitGuardResult {
  const env = getServerEnv();

  if (!env.POLYMARKET_PUBLIC_LIVE_ENABLED) {
    return {
      ok: false,
      code: "live_disabled",
      message: "Live trading is disabled."
    };
  }

  if (env.POLYMARKET_OPERATOR_CONFIRM_LIVE_TRADING !== "I_UNDERSTAND_REAL_ORDERS") {
    return {
      ok: false,
      code: "operator_confirmation_missing",
      message: "Operator live-trading confirmation is missing."
    };
  }

  if (!env.POLYMARKET_BUILDER_CODE) {
    return {
      ok: false,
      code: "builder_code_missing",
      message: "Builder code is missing."
    };
  }

  return { ok: true };
}
