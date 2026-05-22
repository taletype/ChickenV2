import "server-only";
import type { ServerEnv } from "@/lib/env/server-env";
import type { SubmitSignedOrderClientResult } from "../submit-signed-order-client";
import {
  buildPolymarketLiveSubmitIdempotencyHash,
  getDefaultPolymarketOrderAttemptStore,
  hashSignedPolymarketOrder,
  type PolymarketOrderAttemptStore
} from "../order-attempts";
import { prepareSignedPolymarketOrder } from "../order-preparation";
import type { PolymarketApiKeyCredentials } from "../l2-credentials";
import type { LiveOrderRateLimitStore } from "../live-order-rate-limits";
import { recordPolymarketFailedSubmitForCooldown } from "../live-order-rate-limits";
import { recordPolymarketLiveTradingAuditEvent } from "../live-trading-audit";
import type { ResolveCanonicalPolymarketOrderMarketOptions } from "../server-order-market";

export type LiveSignedOrderSubmitAdapter = {
  configured: true;
  submit(input: {
    credentials: PolymarketApiKeyCredentials;
    signedOrder: Record<string, unknown>;
  }): Promise<SubmitSignedOrderClientResult>;
};

export async function submitViaSdkFirstAdapter(
  payload: unknown,
  options: ResolveCanonicalPolymarketOrderMarketOptions & {
    credentials?: PolymarketApiKeyCredentials | null;
    env?: ServerEnv;
    liveSubmitAdapter?: LiveSignedOrderSubmitAdapter | null;
    orderAttemptStore?: PolymarketOrderAttemptStore;
    rateLimitStore?: LiveOrderRateLimitStore;
  } = {}
): Promise<SubmitSignedOrderClientResult> {
  const orderAttemptStore =
    options.orderAttemptStore ?? getDefaultPolymarketOrderAttemptStore();
  const signedOrder =
    payload && typeof payload === "object"
      ? (payload as Record<string, unknown>).signedOrder
      : undefined;
  const prepared = await prepareSignedPolymarketOrder(payload, {
    ...options,
    orderAttemptStore,
    phase: "submit",
    requireSignedOrder: true,
    signedOrder
  });

  if (prepared.status !== "ready") {
    if (prepared.attempt?.walletAddress) {
      await recordPolymarketFailedSubmitForCooldown({
        walletAddress: prepared.attempt.walletAddress,
        store: options.rateLimitStore
      });
    }

    return {
      status: "blocked",
      code: prepared.code,
      message: prepared.message,
      diagnostics: prepared.diagnostics
    };
  }

  if (!("signedOrder" in prepared)) {
    return {
      status: "blocked",
      code: "signed_order_invalid",
      message: "Signed order is required before live submit."
    };
  }

  const idempotencyHash = buildPolymarketLiveSubmitIdempotencyHash({
    walletAddress: prepared.intent.ownerAddress ?? "",
    marketSlug: prepared.intent.marketSlug,
    tokenId: prepared.intent.tokenId,
    side: prepared.intent.side,
    price: prepared.intent.price,
    size: prepared.intent.size,
    signedOrderHashOrClientId:
      payload && typeof payload === "object"
        ? String(
            (payload as Record<string, unknown>).clientOrderId ??
              (payload as Record<string, unknown>).idempotencyKey ??
              hashSignedPolymarketOrder(prepared.signedOrder)
          )
        : hashSignedPolymarketOrder(prepared.signedOrder)
  });
  const duplicate = await orderAttemptStore.findByIdempotencyHash(idempotencyHash);

  if (duplicate) {
    return {
      status: "blocked",
      code: duplicate.blockedReason ?? "duplicate_submit",
      message: "Duplicate live submit attempt was blocked.",
      diagnostics: duplicate.diagnostics
    };
  }

  if (!options.liveSubmitAdapter?.configured) {
    await orderAttemptStore.update(prepared.attempt.id, {
      blockedReason: "signed_submit_adapter_not_configured",
      diagnostics: {
        ...prepared.diagnostics,
        idempotencyHash,
        phase: "adapter_configuration",
        reason: "signed_submit_adapter_not_configured"
      },
      idempotencyHash,
      status: "submit_blocked"
    });
    const diagnostics = {
      ...prepared.diagnostics,
      idempotencyHash,
      phase: "adapter_configuration",
      reason: "signed_submit_adapter_not_configured"
    };
    recordPolymarketLiveTradingAuditEvent({
      name: "order_submit_blocked",
      attemptId: prepared.attempt.id,
      walletAddress: prepared.intent.ownerAddress,
      marketSlug: prepared.intent.marketSlug,
      reason: "signed_submit_adapter_not_configured",
      metadata: diagnostics
    });
    await recordPolymarketFailedSubmitForCooldown({
      walletAddress: prepared.intent.ownerAddress ?? "",
      store: options.rateLimitStore
    });
    return {
      status: "blocked",
      code: "signed_submit_adapter_not_configured",
      message:
        "SDK-first live submission requires a configured server adapter and remains fail-closed.",
      diagnostics
    };
  }

  return options.liveSubmitAdapter.submit({
    credentials: prepared.credentials,
    signedOrder: prepared.signedOrder
  });
}
