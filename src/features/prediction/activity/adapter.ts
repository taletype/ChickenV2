import type {
  PredictionActivityViewModel,
  PredictionOpenOrdersViewModel
} from "../types";

export const ACTIVITY_BACKEND_UNAVAILABLE_REASON =
  "activity_backend_not_configured";
export const OPEN_ORDERS_BACKEND_UNAVAILABLE_REASON =
  "open_orders_backend_not_configured";

/**
 * Future V2 account/activity backend contract:
 * - Resolve wallet/user identity on the server before returning account-scoped rows.
 * - Read fills, orders, and activity from verified upstreams or server-owned persistence.
 * - Keep market and account scopes explicit so rows cannot leak between wallets.
 * - Return empty states only when the verified adapter returns no rows.
 * - Keep cancel/delete/hide/write operations behind separate server-side guards.
 */
export function buildMarketActivityViewModel(): PredictionActivityViewModel {
  return {
    status: "unavailable",
    scope: "market",
    records: [],
    reason: ACTIVITY_BACKEND_UNAVAILABLE_REASON,
    error: null
  };
}

export function buildAccountActivityViewModel(): PredictionActivityViewModel {
  return {
    status: "unavailable",
    scope: "account",
    records: [],
    reason: ACTIVITY_BACKEND_UNAVAILABLE_REASON,
    error: null
  };
}

export function buildMarketOpenOrdersViewModel(): PredictionOpenOrdersViewModel {
  return {
    status: "unavailable",
    scope: "market",
    orders: [],
    reason: OPEN_ORDERS_BACKEND_UNAVAILABLE_REASON,
    error: null
  };
}

export function buildAccountOpenOrdersViewModel(): PredictionOpenOrdersViewModel {
  return {
    status: "unavailable",
    scope: "account",
    orders: [],
    reason: OPEN_ORDERS_BACKEND_UNAVAILABLE_REASON,
    error: null
  };
}
