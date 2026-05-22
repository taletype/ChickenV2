import { z } from "zod";
import { getServerEnv } from "@/lib/env/server-env";
import { normalizeEvmAddress } from "@/lib/wallet/address";
import { isPriceAlignedToTick, snapPriceToPolymarketTick } from "./tick-size";

export const polymarketOrderIntentSchema = z.object({
  tokenId: z.string().min(1),
  marketSlug: z.string().min(1),
  outcome: z.string().min(1),
  side: z.enum(["BUY", "SELL"]),
  price: z.number().min(0.01).max(0.99),
  size: z.number().positive(),
  tickSize: z.number().positive().default(0.01),
  minSize: z.number().positive().optional(),
  ownerAddress: z.string().optional(),
  funderAddress: z.string().optional()
});

export type PolymarketOrderIntent = z.infer<typeof polymarketOrderIntentSchema>;

export type OrderValidationResult =
  | {
      ok: true;
      intent: PolymarketOrderIntent;
    }
  | {
      ok: false;
      code:
        | "live_trading_disabled"
        | "invalid_order"
        | "price_tick_mismatch"
        | "minimum_size_not_met"
        | "wallet_identity_missing";
      message: string;
      nearestValidPrice?: number;
    };

export function validatePolymarketOrderIntent(
  input: unknown,
  options: { requireLiveGate?: boolean } = { requireLiveGate: true }
): OrderValidationResult {
  const env = getServerEnv();

  if (options.requireLiveGate && !env.POLYMARKET_PUBLIC_LIVE_ENABLED) {
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

  if (!ownerAddress || !funderAddress) {
    return {
      ok: false,
      code: "wallet_identity_missing",
      message: "Wallet identity is required before preparing a live order."
    };
  }

  if (!isPriceAlignedToTick(intent.price, intent.tickSize)) {
    return {
      ok: false,
      code: "price_tick_mismatch",
      message: `Price must be a multiple of ${intent.tickSize}.`,
      nearestValidPrice: snapPriceToPolymarketTick(intent.price, intent.tickSize)
    };
  }

  if (intent.minSize && intent.size < intent.minSize) {
    return {
      ok: false,
      code: "minimum_size_not_met",
      message: `Minimum order size is ${intent.minSize}.`
    };
  }

  return {
    ok: true,
    intent
  };
}
