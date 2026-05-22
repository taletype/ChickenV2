import "server-only";

export type PolymarketLiveTradingAuditEventName =
  | "readiness_evaluated"
  | "order_prepare_blocked"
  | "order_prepared"
  | "order_submit_blocked"
  | "order_submit_failed"
  | "order_submitted";

export type PolymarketLiveTradingAuditEvent = {
  name: PolymarketLiveTradingAuditEventName;
  attemptId?: string | null;
  walletAddress?: string | null;
  marketSlug?: string | null;
  reason?: string | null;
  metadata: Record<string, unknown>;
  createdAt: string;
};

const SENSITIVE_KEY_PATTERN =
  /secret|private|passphrase|auth|bearer|session|signature|api[-_]?key|credential|clob/i;
const SAFE_KEYS = new Set([
  "attemptId",
  "blockers",
  "code",
  "fieldChecks",
  "failedFields",
  "funderAddress",
  "gates",
  "maker",
  "marketSlug",
  "mode",
  "notionalUsd",
  "ownerAddress",
  "phase",
  "price",
  "reason",
  "side",
  "signer",
  "signatureType",
  "size",
  "status",
  "tickSize",
  "tokenId",
  "walletAddress"
]);
const LONG_HEX_PATTERN = /0x[a-fA-F0-9]{64,}/g;
const MAX_STRING_LENGTH = 180;

const auditEvents: PolymarketLiveTradingAuditEvent[] = [];

function redactString(value: string) {
  return value.replace(LONG_HEX_PATTERN, "0xREDACTED").slice(0, MAX_STRING_LENGTH);
}

export function redactPolymarketLiveTradingMetadata(value: unknown): unknown {
  if (value === null || value === undefined) {
    return value;
  }

  if (typeof value === "string") {
    return redactString(value);
  }

  if (typeof value === "number" || typeof value === "boolean") {
    return value;
  }

  if (Array.isArray(value)) {
    return value.map((item) => redactPolymarketLiveTradingMetadata(item));
  }

  if (typeof value === "object") {
    const safe: Record<string, unknown> = {};
    for (const [key, entry] of Object.entries(value as Record<string, unknown>)) {
      if (!SAFE_KEYS.has(key) && SENSITIVE_KEY_PATTERN.test(key)) {
        safe[key] = "[REDACTED]";
        continue;
      }
      safe[key] = redactPolymarketLiveTradingMetadata(entry);
    }
    return safe;
  }

  return null;
}

export function buildRedactedPolymarketDiagnostics(
  metadata: Record<string, unknown>
) {
  return redactPolymarketLiveTradingMetadata(metadata) as Record<string, unknown>;
}

export function recordPolymarketLiveTradingAuditEvent(
  input: Omit<PolymarketLiveTradingAuditEvent, "createdAt" | "metadata"> & {
    metadata?: Record<string, unknown>;
  }
) {
  const event: PolymarketLiveTradingAuditEvent = {
    ...input,
    metadata: buildRedactedPolymarketDiagnostics(input.metadata ?? {}),
    createdAt: new Date().toISOString()
  };
  auditEvents.push(event);
  return event;
}

export function listPolymarketLiveTradingAuditEvents() {
  return [...auditEvents];
}

export function clearPolymarketLiveTradingAuditEventsForTests() {
  auditEvents.length = 0;
}
