import type { PredictionLeaderboardViewModel } from "@/features/prediction/types";

export const LEADERBOARD_BACKEND_UNAVAILABLE_REASON =
  "leaderboard_backend_not_configured";

export function buildLeaderboardViewModel(): PredictionLeaderboardViewModel {
  return {
    status: "unavailable",
    rows: [],
    reason: LEADERBOARD_BACKEND_UNAVAILABLE_REASON,
    error: null
  };
}
