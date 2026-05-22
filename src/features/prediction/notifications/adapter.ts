import type { PredictionNotificationInboxViewModel } from "@/features/prediction/types";

export const NOTIFICATIONS_BACKEND_UNAVAILABLE_REASON =
  "notifications_backend_not_configured";

export function buildNotificationInboxViewModel(): PredictionNotificationInboxViewModel {
  return {
    status: "unavailable",
    notifications: [],
    unreadCount: null,
    reason: NOTIFICATIONS_BACKEND_UNAVAILABLE_REASON,
    error: null
  };
}
