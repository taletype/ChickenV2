import type { EvmAddress } from "./address";
import { normalizeEvmAddress } from "./address";

export type TradingWalletContext =
  | {
      status: "ready";
      ownerAddress: EvmAddress;
      funderAddress: EvmAddress;
      signatureType: 0 | 1 | 2 | 3;
    }
  | {
      status: "missing";
      reason: "missing_owner_wallet" | "missing_funder_wallet";
    };

export function deriveTradingWalletContext(input: {
  ownerAddress?: string | null;
  funderAddress?: string | null;
  signatureType?: 0 | 1 | 2 | 3;
}): TradingWalletContext {
  const ownerAddress = normalizeEvmAddress(input.ownerAddress);
  const funderAddress = normalizeEvmAddress(input.funderAddress ?? input.ownerAddress);

  if (!ownerAddress) {
    return { status: "missing", reason: "missing_owner_wallet" };
  }

  if (!funderAddress) {
    return { status: "missing", reason: "missing_funder_wallet" };
  }

  return {
    status: "ready",
    ownerAddress,
    funderAddress,
    signatureType: input.signatureType ?? 2
  };
}
