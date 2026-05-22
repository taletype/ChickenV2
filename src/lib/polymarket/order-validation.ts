import { z } from "zod";
import { getServerEnv } from "@/lib/env/server-env";
import { normalizeEvmAddress, type EvmAddress } from "@/lib/wallet/address";
import type { TradingWalletContext } from "@/lib/wallet/trading-wallet-context";
import type { PolymarketMarket } from "./types";
import { isPriceAlignedToTick, snapPriceToPolymarketTick } from "./tick-size";

const uintStringSchema = z.preprocess(
  (value) =>
    typeof value === "number" && Number.isInteger(value) ? String(value) : value,
  z.string().regex(/^(?:0|[1-9]\d*)$/)
);
const hexAddressSchema = z
  .string()
  .regex(/^0x[a-fA-F0-9]{40}$/)
  .transform((value) => value.toLowerCase() as EvmAddress);
const bytes32Schema = z.string().regex(/^0x[a-fA-F0-9]{64}$/);
const signatureTypeSchema = z.preprocess(
  (value) =>
    typeof value === "string" && /^\d+$/.test(value) ? Number(value) : value,
  z.union([z.literal(0), z.literal(1), z.literal(2), z.literal(3)])
);

export const polymarketOrderIntentSchema = z.object({
  tokenId: z.string().min(1),
  marketId: z.string().min(1).optional(),
  marketSlug: z.string().min(1),
  outcome: z.string().min(1),
  outcomeId: z.string().min(1).optional(),
  side: z.enum(["BUY", "SELL"]),
  price: z.number().min(0.01).max(0.99),
  size: z.number().positive(),
  tickSize: z.number().positive().default(0.01),
  minSize: z.number().positive().optional(),
  ownerAddress: z.string().optional(),
  funderAddress: z.string().optional(),
  walletChainId: z.number().int().positive().default(137),
  riskDisclosureAccepted: z.boolean().optional(),
  orderType: z.enum(["GTC", "FOK"]).default("GTC")
});

export const signedPolymarketOrderSchema = z
  .object({
    salt: uintStringSchema,
    maker: hexAddressSchema,
    signer: hexAddressSchema,
    tokenId: uintStringSchema,
    makerAmount: uintStringSchema,
    takerAmount: uintStringSchema,
    side: z.enum(["BUY", "SELL"]),
    signatureType: signatureTypeSchema,
    timestamp: uintStringSchema,
    metadata: bytes32Schema,
    builder: bytes32Schema,
    expiration: uintStringSchema.default("0"),
    signature: z.string().regex(/^0x[a-fA-F0-9]{130,}$/)
  })
  .passthrough();

export type PolymarketOrderIntent = z.infer<typeof polymarketOrderIntentSchema>;
export type SignedPolymarketOrder = z.infer<typeof signedPolymarketOrderSchema>;

export type OrderValidationResult =
  | {
      ok: true;
      intent: PolymarketOrderIntent;
      notionalUsd: number;
    }
  | {
      ok: false;
      code:
        | "live_trading_disabled"
        | "invalid_order"
        | "market_not_tradable"
        | "invalid_market_token"
        | "wrong_chain"
        | "price_tick_mismatch"
        | "minimum_size_not_met"
        | "wallet_identity_missing"
        | "wallet_identity_mismatch";
      message: string;
      nearestValidPrice?: number;
    };

export type SignedOrderValidationResult =
  | {
      ok: true;
      signedOrder: SignedPolymarketOrder;
      diagnostics: SignedOrderIdentityDiagnostics;
    }
  | {
      ok: false;
      code:
        | "signed_order_invalid"
        | "placeholder_signature_rejected"
        | "signed_order_identity_mismatch"
        | "signed_order_payload_invalid";
      message: string;
      diagnostics: SignedOrderIdentityDiagnostics;
    };

export type SignedOrderIdentityDiagnostics = {
  maker: string | null;
  signer: string | null;
  expectedMaker: string | null;
  expectedSigner: string | null;
  signatureType: number | null;
  expectedSignatureType: number | null;
  tokenId: string | null;
  expectedTokenId: string | null;
  fieldChecks: Record<string, boolean>;
  failedFields: string[];
};

const SDK_FIRST_PLACEHOLDER_SIGNATURE = `0x${"1".repeat(130)}`;

function canonicalTickSize(
  intent: PolymarketOrderIntent,
  market?: PolymarketMarket | null
) {
  return market?.tickSize ?? intent.tickSize;
}

function canonicalMinimumSize(
  intent: PolymarketOrderIntent,
  market?: PolymarketMarket | null
) {
  return market?.minimumOrderSize ?? intent.minSize ?? null;
}

function marketOutcomeForIntent(
  intent: PolymarketOrderIntent,
  market?: PolymarketMarket | null
) {
  return market?.outcomes.find((outcome) => outcome.tokenId === intent.tokenId) ?? null;
}

export function validatePolymarketOrderIntent(
  input: unknown,
  options: {
    canonicalMarket?: PolymarketMarket | null;
    requireLiveGate?: boolean;
  } = { requireLiveGate: true }
): OrderValidationResult {
  const env = getServerEnv();

  if (options.requireLiveGate !== false && !env.POLYMARKET_PUBLIC_LIVE_ENABLED) {
    return {
      ok: false,
      code: "live_trading_disabled",
      message: "Live trading is disabled."
    };
  }

  const parsed = polymarketOrderIntentSchema.safeParse(input);

  if (!parsed.success) {
    return {
      ok: false,
      code: "invalid_order",
      message: "Order intent failed validation."
    };
  }

  const intent = parsed.data;
  const ownerAddress = normalizeEvmAddress(intent.ownerAddress);
  const funderAddress = normalizeEvmAddress(intent.funderAddress ?? intent.ownerAddress);
  const canonicalMarket = options.canonicalMarket;

  if (!ownerAddress || !funderAddress) {
    return {
      ok: false,
      code: "wallet_identity_missing",
      message: "Wallet identity is required before preparing a live order."
    };
  }

  if (intent.walletChainId !== env.POLYMARKET_CHAIN_ID) {
    return {
      ok: false,
      code: "wrong_chain",
      message: "Wallet must be on Polygon."
    };
  }

  if (canonicalMarket) {
    if (!canonicalMarket.active || canonicalMarket.closed || canonicalMarket.archived) {
      return {
        ok: false,
        code: "market_not_tradable",
        message: "Market is not tradable."
      };
    }

    const outcome = marketOutcomeForIntent(intent, canonicalMarket);
    if (!outcome || !outcome.tradable) {
      return {
        ok: false,
        code: "invalid_market_token",
        message: "Token does not belong to the canonical market."
      };
    }
  }

  const tickSize = canonicalTickSize(intent, canonicalMarket);
  if (!isPriceAlignedToTick(intent.price, tickSize)) {
    return {
      ok: false,
      code: "price_tick_mismatch",
      message: `Price must be a multiple of ${tickSize}.`,
      nearestValidPrice: snapPriceToPolymarketTick(intent.price, tickSize)
    };
  }

  const minimumSize = canonicalMinimumSize(intent, canonicalMarket);
  if (minimumSize && intent.size < minimumSize) {
    return {
      ok: false,
      code: "minimum_size_not_met",
      message: `Minimum order size is ${minimumSize}.`
    };
  }

  return {
    ok: true,
    intent: {
      ...intent,
      ownerAddress,
      funderAddress,
      tickSize,
      minSize: minimumSize ?? undefined
    },
    notionalUsd: intent.price * intent.size
  };
}

export function isSdkFirstPlaceholderSignature(signature: unknown) {
  return (
    typeof signature === "string" &&
    signature.toLowerCase().startsWith(SDK_FIRST_PLACEHOLDER_SIGNATURE)
  );
}

function signedOrderDiagnostics(input: {
  signedOrder: Partial<SignedPolymarketOrder> | null;
  intent: PolymarketOrderIntent;
  walletContext: TradingWalletContext;
}): SignedOrderIdentityDiagnostics {
  const expectedMaker =
    input.walletContext.status === "ready" ? input.walletContext.funderAddress : null;
  const expectedSigner =
    input.walletContext.status === "ready"
      ? input.walletContext.signatureType === 3
        ? input.walletContext.funderAddress
        : input.walletContext.ownerAddress
      : null;
  const expectedSignatureType =
    input.walletContext.status === "ready" ? input.walletContext.signatureType : null;
  const fieldChecks = {
    maker:
      Boolean(input.signedOrder?.maker && expectedMaker) &&
      input.signedOrder?.maker === expectedMaker,
    signer:
      Boolean(input.signedOrder?.signer && expectedSigner) &&
      input.signedOrder?.signer === expectedSigner,
    signatureType:
      Number(input.signedOrder?.signatureType) === Number(expectedSignatureType),
    tokenId: String(input.signedOrder?.tokenId ?? "") === input.intent.tokenId
  };

  return {
    maker: input.signedOrder?.maker ?? null,
    signer: input.signedOrder?.signer ?? null,
    expectedMaker,
    expectedSigner,
    signatureType:
      typeof input.signedOrder?.signatureType === "number"
        ? input.signedOrder.signatureType
        : null,
    expectedSignatureType,
    tokenId: input.signedOrder?.tokenId ? String(input.signedOrder.tokenId) : null,
    expectedTokenId: input.intent.tokenId,
    fieldChecks,
    failedFields: Object.entries(fieldChecks)
      .filter(([, ready]) => !ready)
      .map(([field]) => field)
  };
}

export function validateSignedPolymarketOrder(input: {
  intent: PolymarketOrderIntent;
  signedOrder: unknown;
  walletContext: TradingWalletContext;
}): SignedOrderValidationResult {
  const parsed = signedPolymarketOrderSchema.safeParse(input.signedOrder);

  if (!parsed.success) {
    return {
      ok: false,
      code: "signed_order_invalid",
      message: "Signed order failed validation.",
      diagnostics: signedOrderDiagnostics({
        signedOrder:
          input.signedOrder && typeof input.signedOrder === "object"
            ? (input.signedOrder as Partial<SignedPolymarketOrder>)
            : null,
        intent: input.intent,
        walletContext: input.walletContext
      })
    };
  }

  if (isSdkFirstPlaceholderSignature(parsed.data.signature)) {
    return {
      ok: false,
      code: "placeholder_signature_rejected",
      message: "Placeholder signatures are not accepted.",
      diagnostics: signedOrderDiagnostics({
        signedOrder: parsed.data,
        intent: input.intent,
        walletContext: input.walletContext
      })
    };
  }

  const diagnostics = signedOrderDiagnostics({
    signedOrder: parsed.data,
    intent: input.intent,
    walletContext: input.walletContext
  });

  if (!diagnostics.fieldChecks.maker || !diagnostics.fieldChecks.signer) {
    return {
      ok: false,
      code: "signed_order_identity_mismatch",
      message: "Signed order maker/signer does not match wallet context.",
      diagnostics
    };
  }

  if (
    !diagnostics.fieldChecks.signatureType ||
    !diagnostics.fieldChecks.tokenId
  ) {
    return {
      ok: false,
      code: "signed_order_payload_invalid",
      message: "Signed order payload does not match the validated order.",
      diagnostics
    };
  }

  return {
    ok: true,
    signedOrder: parsed.data,
    diagnostics
  };
}
