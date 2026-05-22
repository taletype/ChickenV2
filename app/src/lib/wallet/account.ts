import type { EvmAddress } from "./address";
import { normalizeEvmAddress, shortAddress } from "./address";

export type WalletAccountState =
  | {
      status: "connected";
      address: EvmAddress;
      label: string;
    }
  | {
      status: "disconnected";
      address: null;
      label: null;
    };

export function resolveWalletAccount(address: string | null | undefined): WalletAccountState {
  const normalized = normalizeEvmAddress(address);

  if (!normalized) {
    return {
      status: "disconnected",
      address: null,
      label: null
    };
  }

  return {
    status: "connected",
    address: normalized,
    label: shortAddress(normalized) ?? normalized
  };
}
