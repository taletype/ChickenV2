import { listPolymarketFills } from "@/lib/polymarket/analytics/fills";
import { derivePnlSnapshot } from "@/lib/polymarket/analytics/pnl";
import { listPolymarketPositions } from "@/lib/polymarket/analytics/positions";
import { resolveWalletAccount } from "@/lib/wallet/account";
import type { PredictionPortfolioViewModel } from "../types";
import {
  buildAccountActivityViewModel,
  buildAccountOpenOrdersViewModel
} from "../activity/adapter";

export async function buildPortfolioViewModel(options: {
  address?: string | null;
}): Promise<PredictionPortfolioViewModel> {
  const account = resolveWalletAccount(options.address);
  const accountActivity = buildAccountActivityViewModel();
  const openOrders = buildAccountOpenOrdersViewModel();

  if (account.status !== "connected") {
    return {
      status: "disconnected",
      addressLabel: null,
      positions: [],
      fills: [],
      pnl: {
        status: "unavailable",
        reason: "wallet_disconnected"
      },
      accountActivity,
      openOrders,
      error: null
    };
  }

  try {
    const [positions, fills] = await Promise.all([
      listPolymarketPositions(account.address),
      listPolymarketFills(account.address)
    ]);

    return {
      status: "ready",
      addressLabel: account.label,
      positions,
      fills,
      pnl: derivePnlSnapshot(positions),
      accountActivity,
      openOrders,
      error: null
    };
  } catch (error) {
    return {
      status: "unavailable",
      addressLabel: account.label,
      positions: [],
      fills: [],
      pnl: {
        status: "unavailable",
        reason: "upstream_unavailable"
      },
      accountActivity,
      openOrders,
      error: error instanceof Error ? error.message : "portfolio_unavailable"
    };
  }
}
