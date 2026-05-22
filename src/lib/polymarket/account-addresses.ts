import type { EvmAddress } from "@/lib/wallet/address";
import { normalizeEvmAddress } from "@/lib/wallet/address";

export type PolymarketAccountAddresses =
  | {
      status: "ready";
      ownerAddress: EvmAddress;
      funderAddress: EvmAddress;
    }
  | {
      status: "missing";
      reason: "missing_wallet_address" | "invalid_wallet_address";
    };

export function resolvePolymarketAccountAddresses(input: {
  ownerAddress?: string | null;
  funderAddress?: string | null;
}): PolymarketAccountAddresses {
  if (!input.ownerAddress) {
    return { status: "missing", reason: "missing_wallet_address" };
  }

  const ownerAddress = normalizeEvmAddress(input.ownerAddress);
  const funderAddress = normalizeEvmAddress(input.funderAddress ?? input.ownerAddress);

  if (!ownerAddress || !funderAddress) {
    return { status: "missing", reason: "invalid_wallet_address" };
  }

  return {
    status: "ready",
    ownerAddress,
    funderAddress
  };
}
