import type { PolymarketPosition } from "./positions";

export type PolymarketPnlSnapshot =
  | {
      status: "available";
      totalCurrentValue: number;
    }
  | {
      status: "unavailable";
      reason: "missing_position_values";
    };

export function derivePnlSnapshot(
  positions: PolymarketPosition[]
): PolymarketPnlSnapshot {
  if (positions.some((position) => position.currentValue === null)) {
    return {
      status: "unavailable",
      reason: "missing_position_values"
    };
  }

  return {
    status: "available",
    totalCurrentValue: positions.reduce(
      (total, position) => total + (position.currentValue ?? 0),
      0
    )
  };
}
