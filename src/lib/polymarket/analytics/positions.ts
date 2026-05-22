import "server-only";
import { fetchPolymarketDataApi } from "./client";

export type PolymarketPosition = {
  market: string;
  outcome: string;
  size: number;
  currentValue: number | null;
};

function normalizePosition(record: Record<string, unknown>): PolymarketPosition | null {
  const market = String(record.market ?? record.title ?? "");
  const outcome = String(record.outcome ?? "");
  const size = Number(record.size ?? record.quantity);
  const currentValue = Number(record.currentValue ?? record.value);

  if (!market || !outcome || !Number.isFinite(size)) {
    return null;
  }

  return {
    market,
    outcome,
    size,
    currentValue: Number.isFinite(currentValue) ? currentValue : null
  };
}

export async function listPolymarketPositions(address: string) {
  const raw = await fetchPolymarketDataApi<unknown>("/positions", {
    user: address
  });
  const records = Array.isArray(raw) ? raw : [];

  return records
    .map((record) =>
      record && typeof record === "object"
        ? normalizePosition(record as Record<string, unknown>)
        : null
    )
    .filter((position): position is PolymarketPosition => position !== null);
}
