import "server-only";
import type { EvmAddress } from "./address";
import { normalizeEvmAddress } from "./address";

export type WalletSignInSession =
  | {
      authenticated: true;
      address: EvmAddress;
      source: "query" | "server-session";
    }
  | {
      authenticated: false;
      address: null;
      source: "missing";
    };

export function resolveWalletSessionFromAddress(
  address: string | null | undefined
): WalletSignInSession {
  const normalized = normalizeEvmAddress(address);

  if (!normalized) {
    return {
      authenticated: false,
      address: null,
      source: "missing"
    };
  }

  return {
    authenticated: true,
    address: normalized,
    source: "query"
  };
}
