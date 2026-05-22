import "server-only";
import { assertLiveSubmitGuards } from "./live-submit-guards";

export function getLiveTradingReadiness() {
  const guards = assertLiveSubmitGuards();

  return guards.ok
    ? {
        status: "ready" as const,
        blockers: [] as string[]
      }
    : {
        status: "blocked" as const,
        blockers: [guards.code]
      };
}
