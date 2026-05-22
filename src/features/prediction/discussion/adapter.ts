import type { PredictionDiscussionViewModel } from "../types";

export const DISCUSSION_BACKEND_UNAVAILABLE_REASON =
  "discussion_backend_not_configured";

/**
 * Future V2 discussion backend contract:
 * - Resolve wallet/user identity on the server from the active wallet session.
 * - Enforce per-wallet and per-market rate limits before accepting writes.
 * - Provide moderation/reporting decisions from a server-owned review path.
 * - Support delete/hide controls without trusting client-only ownership claims.
 * - Apply spam controls before persistence and before fan-out to clients.
 * - Store comments and replies in server-owned persistence with auditable IDs.
 */
export function buildDiscussionViewModel(options: {
  marketSlug: string;
}): PredictionDiscussionViewModel {
  return {
    status: "unavailable",
    marketSlug: options.marketSlug,
    comments: [],
    reason: DISCUSSION_BACKEND_UNAVAILABLE_REASON,
    error: null
  };
}
