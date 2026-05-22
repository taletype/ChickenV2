import "server-only";
import { z } from "zod";
import type { ServerEnv } from "@/lib/env/server-env";
import { deriveTradingWalletContext } from "@/lib/wallet/trading-wallet-context";
import type { TradingWalletContext } from "@/lib/wallet/trading-wallet-context";
import {
  buildPolymarketUnsignedOrder,
  type PolymarketUnsignedOrder
} from "./order-builder";
import {
  getPolymarketL2CredentialReadiness,
  type PolymarketApiKeyCredentials
} from "./l2-credentials";
import {
  assertPolymarketFailedSubmitCooldown,
  assertPolymarketLiveOrderRateLimit,
  isLiveOrderRateLimitError,
  type LiveOrderRateLimitStore
} from "./live-order-rate-limits";
import {
  buildRedactedPolymarketDiagnostics,
  recordPolymarketLiveTradingAuditEvent
} from "./live-trading-audit";
import {
  createPolymarketOrderAttempt,
  getDefaultPolymarketOrderAttemptStore,
  type PolymarketOrderAttempt,
  type PolymarketOrderAttemptStore
} from "./order-attempts";
import {
  polymarketOrderIntentSchema,
  validatePolymarketOrderIntent,
  validateSignedPolymarketOrder,
  type PolymarketOrderIntent,
  type SignedPolymarketOrder
} from "./order-validation";
import {
  canonicalOrderMarketErrorLabel,
  resolveCanonicalPolymarketOrderMarket,
  type ResolveCanonicalPolymarketOrderMarketOptions
} from "./server-order-market";
import {
  evaluatePolymarketLiveTradingReadiness,
  type LiveTradingReadiness
} from "./liveTradingReadiness";
import type { PolymarketMarket, PolymarketOutcome } from "./types";

export const prepareSignedOrderRequestSchema = z.object({
  intent: polymarketOrderIntentSchema
});

export type PrepareSignedOrderRequest = z.infer<
  typeof prepareSignedOrderRequestSchema
>;

export type PreparedPolymarketOrder =
  | {
      status: "ready";
      attempt: PolymarketOrderAttempt;
      canonical: {
        market: PolymarketMarket;
        outcome: PolymarketOutcome;
      };
      intent: PolymarketOrderIntent;
      order: PolymarketUnsignedOrder;
      readiness: Extract<LiveTradingReadiness, { status: "ready" }>;
      requiresSignature: true;
      diagnostics: Record<string, unknown>;
    }
  | {
      status: "blocked";
      code: string;
      message: string;
      attempt: PolymarketOrderAttempt | null;
      diagnostics: Record<string, unknown>;
    };

export type LiveSubmitPreparation =
  | (Extract<PreparedPolymarketOrder, { status: "ready" }> & {
      signedOrder: SignedPolymarketOrder;
      walletContext: TradingWalletContext;
      credentials: PolymarketApiKeyCredentials;
    })
  | Extract<PreparedPolymarketOrder, { status: "blocked" }>;

export type PrepareSignedOrderOptions =
  ResolveCanonicalPolymarketOrderMarketOptions & {
    credentials?: PolymarketApiKeyCredentials | null;
    env?: ServerEnv;
    orderAttemptStore?: PolymarketOrderAttemptStore;
    phase?: "prepare" | "submit";
    rateLimitStore?: LiveOrderRateLimitStore;
    requireSignedOrder?: boolean;
    signedOrder?: unknown;
  };

function blocked(input: {
  attempt?: PolymarketOrderAttempt | null;
  code: string;
  diagnostics?: Record<string, unknown>;
  message: string;
}): PreparedPolymarketOrder {
  return {
    status: "blocked",
    code: input.code,
    message: input.message,
    attempt: input.attempt ?? null,
    diagnostics: buildRedactedPolymarketDiagnostics(input.diagnostics ?? {})
  };
}

async function createBlockedAttempt(input: {
  code: string;
  diagnostics: Record<string, unknown>;
  intent: PolymarketOrderIntent;
  options: PrepareSignedOrderOptions;
}) {
  return createPolymarketOrderAttempt(
    {
      walletAddress: input.intent.ownerAddress ?? "wallet_missing",
      marketSlug: input.intent.marketSlug,
      tokenId: input.intent.tokenId,
      side: input.intent.side,
      price: input.intent.price,
      size: input.intent.size,
      status: input.options.phase === "submit" ? "submit_blocked" : "prepare_blocked",
      blockedReason: input.code,
      diagnostics: input.diagnostics
    },
    input.options.orderAttemptStore ?? getDefaultPolymarketOrderAttemptStore()
  );
}

async function assertRateAndCooldown(input: {
  intent: PolymarketOrderIntent;
  options: PrepareSignedOrderOptions;
}) {
  try {
    await assertPolymarketLiveOrderRateLimit({
      phase: input.options.phase ?? "prepare",
      walletAddress: input.intent.ownerAddress ?? "",
      store: input.options.rateLimitStore
    });

    if (input.options.phase === "submit") {
      await assertPolymarketFailedSubmitCooldown({
        walletAddress: input.intent.ownerAddress ?? "",
        store: input.options.rateLimitStore
      });
    }

    return { rateLimitAllowed: true, cooldownAllowed: true, code: null };
  } catch (error) {
    if (isLiveOrderRateLimitError(error)) {
      return {
        rateLimitAllowed: error.code !== "rate_limited",
        cooldownAllowed: error.code !== "cooldown_active",
        code: error.code
      };
    }
    return {
      rateLimitAllowed: false,
      cooldownAllowed: true,
      code: "rate_limited" as const
    };
  }
}

export async function prepareSignedPolymarketOrder(
  input: unknown,
  options: PrepareSignedOrderOptions = {}
): Promise<PreparedPolymarketOrder | LiveSubmitPreparation> {
  const parsed = prepareSignedOrderRequestSchema.safeParse(
    "intent" in Object(input ?? {}) ? input : { intent: input }
  );

  if (!parsed.success) {
    return blocked({
      code: "invalid_order",
      message: "Order intent failed validation.",
      diagnostics: { phase: options.phase ?? "prepare" }
    });
  }

  const canonical = await resolveCanonicalPolymarketOrderMarket(
    {
      marketId: parsed.data.intent.marketId,
      marketSlug: parsed.data.intent.marketSlug,
      tokenId: parsed.data.intent.tokenId
    },
    options
  );

  if (canonical.status !== "ready") {
    const attempt = await createBlockedAttempt({
      code: canonical.error,
      diagnostics: {
        phase: options.phase ?? "prepare",
        marketSlug: parsed.data.intent.marketSlug,
        tokenId: parsed.data.intent.tokenId
      },
      intent: parsed.data.intent,
      options
    });
    return blocked({
      attempt,
      code: canonical.error,
      message: canonicalOrderMarketErrorLabel(canonical.error),
      diagnostics: attempt.diagnostics
    });
  }

  const validation = validatePolymarketOrderIntent(parsed.data.intent, {
    canonicalMarket: canonical.market,
    requireLiveGate: false
  });

  if (!validation.ok) {
    const attempt = await createBlockedAttempt({
      code: validation.code,
      diagnostics: {
        phase: options.phase ?? "prepare",
        marketSlug: parsed.data.intent.marketSlug,
        tokenId: parsed.data.intent.tokenId
      },
      intent: parsed.data.intent,
      options
    });
    return blocked({
      attempt,
      code: validation.code,
      message: validation.message,
      diagnostics: attempt.diagnostics
    });
  }

  const walletContext = deriveTradingWalletContext({
    ownerAddress: validation.intent.ownerAddress,
    funderAddress: validation.intent.funderAddress,
    signatureType: 2
  });

  if (walletContext.status !== "ready") {
    const attempt = await createBlockedAttempt({
      code: walletContext.reason,
      diagnostics: { phase: options.phase ?? "prepare" },
      intent: validation.intent,
      options
    });
    return blocked({
      attempt,
      code: walletContext.reason,
      message: "Wallet identity is required before preparing a live order.",
      diagnostics: attempt.diagnostics
    });
  }

  const credentialReadiness = getPolymarketL2CredentialReadiness({
    credentials: options.credentials,
    env: options.env
  });
  const rate = await assertRateAndCooldown({ intent: validation.intent, options });
  const signedValidation =
    options.requireSignedOrder === true
      ? validateSignedPolymarketOrder({
          intent: validation.intent,
          signedOrder: options.signedOrder,
          walletContext
        })
      : null;
  const readiness = evaluatePolymarketLiveTradingReadiness(
    {
      builderCode: options.env?.POLYMARKET_BUILDER_CODE,
      cooldownAllowed: rate.cooldownAllowed,
      finalServerValidationOk: validation.ok,
      hasUserSignedOrder:
        options.requireSignedOrder === true
          ? signedValidation?.ok !== false ||
            signedValidation.code !== "signed_order_invalid"
          : undefined,
      l2CredentialsReady: credentialReadiness.status === "ready",
      market: canonical.market,
      marketSlug: canonical.market.slug,
      notionalUsd: validation.notionalUsd,
      outcomeBelongsToMarket: true,
      ownerAddress: walletContext.ownerAddress,
      rateLimitAllowed: rate.rateLimitAllowed,
      riskDisclosureAccepted: validation.intent.riskDisclosureAccepted ?? false,
      signedOrderIdentityMatches:
        signedValidation && !signedValidation.ok
          ? signedValidation.code !== "signed_order_identity_mismatch"
          : undefined,
      signedOrderPayloadValid:
        signedValidation && !signedValidation.ok
          ? signedValidation.code !== "signed_order_payload_invalid" &&
            signedValidation.code !== "signed_order_invalid" &&
            signedValidation.code !== "placeholder_signature_rejected"
          : undefined,
      signerAddress: walletContext.ownerAddress,
      tokenId: validation.intent.tokenId,
      walletAddress: walletContext.ownerAddress,
      walletChainId: validation.intent.walletChainId
    },
    { env: options.env }
  );

  if (readiness.status !== "ready") {
    const blocker = readiness.blockers[0] ?? {
      code: "invalid_order",
      message: "Order failed server validation."
    };
    const attempt = await createBlockedAttempt({
      code: blocker.code,
      diagnostics: {
        blockers: readiness.blockers.map((item) => item.code),
        fieldChecks: signedValidation?.diagnostics.fieldChecks,
        failedFields: signedValidation?.diagnostics.failedFields,
        gates: readiness.gates,
        phase: options.phase ?? "prepare",
        tokenId: validation.intent.tokenId
      },
      intent: validation.intent,
      options
    });
    recordPolymarketLiveTradingAuditEvent({
      name:
        options.phase === "submit" ? "order_submit_blocked" : "order_prepare_blocked",
      attemptId: attempt.id,
      walletAddress: walletContext.ownerAddress,
      marketSlug: validation.intent.marketSlug,
      reason: blocker.code,
      metadata: attempt.diagnostics
    });
    return blocked({
      attempt,
      code: blocker.code,
      message: blocker.message,
      diagnostics: attempt.diagnostics
    });
  }

  const attempt = await createPolymarketOrderAttempt(
    {
      walletAddress: walletContext.ownerAddress,
      marketSlug: validation.intent.marketSlug,
      tokenId: validation.intent.tokenId,
      side: validation.intent.side,
      price: validation.intent.price,
      size: validation.intent.size,
      status: "prepared",
      diagnostics: {
        phase: options.phase ?? "prepare",
        marketSlug: validation.intent.marketSlug,
        tokenId: validation.intent.tokenId
      }
    },
    options.orderAttemptStore ?? getDefaultPolymarketOrderAttemptStore()
  );
  const diagnostics = buildRedactedPolymarketDiagnostics({
    attemptId: attempt.id,
    marketSlug: validation.intent.marketSlug,
    phase: options.phase ?? "prepare",
    tokenId: validation.intent.tokenId
  });

  recordPolymarketLiveTradingAuditEvent({
    name: "order_prepared",
    attemptId: attempt.id,
    walletAddress: walletContext.ownerAddress,
    marketSlug: validation.intent.marketSlug,
    metadata: diagnostics
  });

  const ready = {
    status: "ready" as const,
    attempt,
    canonical: {
      market: canonical.market,
      outcome: canonical.outcome
    },
    intent: validation.intent,
    order: buildPolymarketUnsignedOrder(validation.intent),
    readiness,
    requiresSignature: true as const,
    diagnostics
  };

  if (options.requireSignedOrder === true && signedValidation?.ok === true) {
    return {
      ...ready,
      signedOrder: signedValidation.signedOrder,
      walletContext,
      credentials: credentialReadiness.status === "ready"
        ? credentialReadiness.credentials
        : (null as never)
    } as LiveSubmitPreparation;
  }

  return ready;
}

export function preparePolymarketOrderIntent(input: unknown) {
  return prepareSignedPolymarketOrder(input);
}
