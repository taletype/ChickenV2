import "server-only";
import { createHash, randomUUID } from "node:crypto";
import { normalizeEvmAddress } from "@/lib/wallet/address";

export type PolymarketOrderAttemptStatus =
  | "prepared"
  | "prepare_blocked"
  | "submit_blocked"
  | "submitted"
  | "failed";

export type PolymarketOrderAttempt = {
  id: string;
  walletAddress: string;
  marketSlug: string;
  tokenId: string;
  side: "BUY" | "SELL";
  price: number;
  size: number;
  status: PolymarketOrderAttemptStatus;
  blockedReason: string | null;
  idempotencyHash: string | null;
  externalOrderId: string | null;
  diagnostics: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
};

export type PolymarketOrderAttemptStore = {
  insert(attempt: PolymarketOrderAttempt): Promise<PolymarketOrderAttempt>;
  update(
    id: string,
    patch: Partial<PolymarketOrderAttempt>
  ): Promise<PolymarketOrderAttempt | null>;
  findByIdempotencyHash(hash: string): Promise<PolymarketOrderAttempt | null>;
};

function nowIso() {
  return new Date().toISOString();
}

export function buildPolymarketLiveSubmitIdempotencyHash(input: {
  walletAddress: string;
  marketSlug: string;
  tokenId: string;
  side: "BUY" | "SELL";
  price: number;
  size: number;
  signedOrderHashOrClientId: string;
}) {
  const payload = {
    scope: "polymarket-live-submit",
    walletAddress:
      normalizeEvmAddress(input.walletAddress) ?? input.walletAddress.toLowerCase(),
    marketSlug: input.marketSlug,
    tokenId: input.tokenId,
    side: input.side,
    price: input.price.toFixed(6),
    size: input.size.toFixed(6),
    signedOrderHashOrClientId: input.signedOrderHashOrClientId
  };

  return `live:${createHash("sha256").update(JSON.stringify(payload)).digest("hex")}`;
}

export function hashSignedPolymarketOrder(value: unknown) {
  return createHash("sha256").update(JSON.stringify(value ?? null)).digest("hex");
}

export function createMemoryPolymarketOrderAttemptStore(
  initial: PolymarketOrderAttempt[] = []
): PolymarketOrderAttemptStore {
  const attempts = new Map(initial.map((attempt) => [attempt.id, attempt]));

  return {
    async insert(attempt) {
      attempts.set(attempt.id, attempt);
      return attempt;
    },
    async update(id, patch) {
      const current = attempts.get(id);
      if (!current) {
        return null;
      }
      const updated = {
        ...current,
        ...patch,
        updatedAt: nowIso()
      };
      attempts.set(id, updated);
      return updated;
    },
    async findByIdempotencyHash(hash) {
      return (
        [...attempts.values()].find(
          (attempt) => attempt.idempotencyHash === hash
        ) ?? null
      );
    }
  };
}

const defaultOrderAttemptStore = createMemoryPolymarketOrderAttemptStore();

export function getDefaultPolymarketOrderAttemptStore() {
  return defaultOrderAttemptStore;
}

export async function createPolymarketOrderAttempt(
  input: {
    walletAddress: string;
    marketSlug: string;
    tokenId: string;
    side: "BUY" | "SELL";
    price: number;
    size: number;
    status: PolymarketOrderAttemptStatus;
    blockedReason?: string | null;
    idempotencyHash?: string | null;
    diagnostics?: Record<string, unknown>;
  },
  store: PolymarketOrderAttemptStore = defaultOrderAttemptStore
) {
  const timestamp = nowIso();
  return store.insert({
    id: randomUUID(),
    walletAddress:
      normalizeEvmAddress(input.walletAddress) ?? input.walletAddress.toLowerCase(),
    marketSlug: input.marketSlug,
    tokenId: input.tokenId,
    side: input.side,
    price: input.price,
    size: input.size,
    status: input.status,
    blockedReason: input.blockedReason ?? null,
    idempotencyHash: input.idempotencyHash ?? null,
    externalOrderId: null,
    diagnostics: input.diagnostics ?? {},
    createdAt: timestamp,
    updatedAt: timestamp
  });
}

export async function markPolymarketOrderAttemptBlocked(
  attempt: PolymarketOrderAttempt,
  input: {
    status: "prepare_blocked" | "submit_blocked";
    reason: string;
    diagnostics?: Record<string, unknown>;
  },
  store: PolymarketOrderAttemptStore = defaultOrderAttemptStore
) {
  return store.update(attempt.id, {
    status: input.status,
    blockedReason: input.reason,
    diagnostics: input.diagnostics ?? attempt.diagnostics,
    externalOrderId: null
  });
}
