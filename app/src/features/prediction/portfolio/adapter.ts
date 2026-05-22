import { listPolymarketFills } from "@/lib/polymarket/analytics/fills";
import { derivePnlSnapshot } from "@/lib/polymarket/analytics/pnl";
import { listPolymarketPositions } from "@/lib/polymarket/analytics/positions";
import { resolveWalletAccount } from "@/lib/wallet/account";
import type { PredictionPortfolioViewModel } from "../types";

export async function buildPortfolioViewModel(options: {
  address?: string | null;
}): Promise<PredictionPortfolioViewModel> {
  const account = resolveWalletAccount(options.address);

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
      error: error instanceof Error ? error.message : "portfolio_unavailable"
    };
  }
}
