import type { PolymarketMarket, PolymarketOutcome } from "./types";

type RawMarket = Record<string, unknown>;

function parseArray(value: unknown): unknown[] {
  if (Array.isArray(value)) {
    return value;
  }

  if (typeof value === "string" && value.trim().length > 0) {
    try {
      const parsed = JSON.parse(value) as unknown;
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return value
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean);
    }
  }

  return [];
}

function parseString(value: unknown): string | null {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : null;
}

function parseBoolean(value: unknown, fallback = false): boolean {
  if (typeof value === "boolean") {
    return value;
  }

  if (typeof value === "string") {
    return value === "true";
  }

  return fallback;
}

function parseNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string" && value.trim().length > 0) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
}

function normalizeOutcomePrice(value: unknown): number | null {
  const number = parseNumber(value);

  if (number === null || number < 0 || number > 1) {
    return null;
  }

  return number;
}

function normalizeOutcomes(raw: RawMarket): PolymarketOutcome[] {
  const labels = parseArray(raw.outcomes);
  const prices = parseArray(raw.outcomePrices);
  const tokenIds = parseArray(raw.clobTokenIds ?? raw.clobTokenIDs);

  return labels
    .map((label, index) => ({
      label: String(label),
      tokenId: parseString(tokenIds[index]),
      price: normalizeOutcomePrice(prices[index]),
      tradable: parseString(tokenIds[index]) !== null
    }))
    .filter((outcome) => outcome.label.trim().length > 0);
}

export function normalizePolymarketMarket(
  raw: RawMarket,
  fetchedAt = new Date().toISOString()
): PolymarketMarket | null {
  const id = parseString(raw.id ?? raw.marketId);
  const question = parseString(raw.question ?? raw.title);
  const slug = parseString(raw.slug);

  if (!id || !question || !slug) {
    return null;
  }

  const outcomes = normalizeOutcomes(raw);

  return {
    id,
    conditionId: parseString(raw.conditionId),
    slug,
    question,
    description: parseString(raw.description),
    category: parseString(raw.category),
    image: parseString(raw.image ?? raw.icon),
    volume24hr: parseNumber(raw.volume24hr ?? raw.volume24hrClob ?? raw.volume),
    liquidity: parseNumber(raw.liquidityClob ?? raw.liquidity),
    createdAt: parseString(raw.createdAt),
    endDate: parseString(raw.endDate ?? raw.endDateIso),
    active: parseBoolean(raw.active, true),
    closed: parseBoolean(raw.closed, false),
    archived: parseBoolean(raw.archived, false),
    negRisk: parseBoolean(raw.negRisk, false),
    tickSize: parseNumber(raw.minimumTickSize ?? raw.tickSize) ?? 0.01,
    minimumOrderSize: parseNumber(raw.minimumOrderSize),
    resolutionSource: parseString(raw.resolutionSource),
    resolutionSourceUrl: parseString(raw.resolutionSourceUrl),
    outcomes,
    sourceUpdatedAt: parseString(raw.updatedAt),
    fetchedAt
  };
}

export function normalizePolymarketMarkets(raw: unknown): PolymarketMarket[] {
  const fetchedAt = new Date().toISOString();
  const records = Array.isArray(raw)
    ? raw
    : Array.isArray((raw as { markets?: unknown[] })?.markets)
      ? (raw as { markets: unknown[] }).markets
      : [];

  return records
    .map((record) =>
      record && typeof record === "object"
        ? normalizePolymarketMarket(record as RawMarket, fetchedAt)
        : null
    )
    .filter((market): market is PolymarketMarket => market !== null);
}
