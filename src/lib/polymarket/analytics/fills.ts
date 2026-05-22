import "server-only";
import { fetchPolymarketDataApi } from "./client";

export type PolymarketFill = {
  market: string;
  side: string;
  outcome: string;
  price: number;
  size: number;
  timestamp: string | null;
};

function normalizeFill(record: Record<string, unknown>): PolymarketFill | null {
  const market = String(record.market ?? record.title ?? "");
  const side = String(record.side ?? "");
  const outcome = String(record.outcome ?? "");
  const price = Number(record.price);
  const size = Number(record.size);
  const timestamp =
    typeof record.timestamp === "string"
      ? record.timestamp
      : typeof record.createdAt === "string"
        ? record.createdAt
        : null;

  if (!market || !side || !outcome || !Number.isFinite(price) || !Number.isFinite(size)) {
    return null;
  }

  return { market, side, outcome, price, size, timestamp };
}

export async function listPolymarketFills(address: string) {
  const raw = await fetchPolymarketDataApi<unknown>("/trades", {
    user: address
  });
  const records = Array.isArray(raw) ? raw : [];

  return records
    .map((record) =>
      record && typeof record === "object"
        ? normalizeFill(record as Record<string, unknown>)
        : null
    )
    .filter((fill): fill is PolymarketFill => fill !== null);
}
