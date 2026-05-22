"use client";

import type { EvmAddress } from "./address";
import { normalizeEvmAddress, shortAddress } from "./address";

export const SUPPORTED_WALLET_CHAIN_ID = 137;
export const SUPPORTED_WALLET_CHAIN_NAME = "Polygon";

export type AppKitReadiness =
  | {
      ready: true;
      projectId: string;
    }
  | {
      ready: false;
      reason: "missing_project_id";
    };

export type WalletConnectionViewState =
  | {
      status: "unconfigured";
      address: null;
      chainId: number | string | null;
      expectedChainId: typeof SUPPORTED_WALLET_CHAIN_ID;
      label: null;
      reason: "missing_project_id";
    }
  | {
      status: "disconnected" | "connecting";
      address: null;
      chainId: number | string | null;
      expectedChainId: typeof SUPPORTED_WALLET_CHAIN_ID;
      label: null;
      reason: null;
    }
  | {
      status: "connected";
      address: EvmAddress;
      chainId: typeof SUPPORTED_WALLET_CHAIN_ID;
      expectedChainId: typeof SUPPORTED_WALLET_CHAIN_ID;
      label: string;
      reason: null;
    }
  | {
      status: "unsupported_chain";
      address: EvmAddress;
      chainId: number | string | null;
      expectedChainId: typeof SUPPORTED_WALLET_CHAIN_ID;
      label: string;
      reason: "unsupported_chain";
    };

export function getAppKitReadiness(projectId?: string): AppKitReadiness {
  if (!projectId) {
    return {
      ready: false,
      reason: "missing_project_id"
    };
  }

  return {
    ready: true,
    projectId
  };
}

export function resolveWalletConnectionState(input: {
  readiness: AppKitReadiness;
  address?: string | null;
  chainId?: number | string | null;
  connected?: boolean;
  connecting?: boolean;
}): WalletConnectionViewState {
  const expectedChainId = SUPPORTED_WALLET_CHAIN_ID;

  if (!input.readiness.ready) {
    return {
      status: "unconfigured",
      address: null,
      chainId: input.chainId ?? null,
      expectedChainId,
      label: null,
      reason: input.readiness.reason
    };
  }

  const address = normalizeEvmAddress(input.address);

  if (!input.connected || !address) {
    return {
      status: input.connecting ? "connecting" : "disconnected",
      address: null,
      chainId: input.chainId ?? null,
      expectedChainId,
      label: null,
      reason: null
    };
  }

  const chainId =
    typeof input.chainId === "string" ? Number(input.chainId) : input.chainId;
  const label = shortAddress(address) ?? address;

  if (chainId !== expectedChainId) {
    return {
      status: "unsupported_chain",
      address,
      chainId: input.chainId ?? null,
      expectedChainId,
      label,
      reason: "unsupported_chain"
    };
  }

  return {
    status: "connected",
    address,
    chainId: expectedChainId,
    expectedChainId,
    label,
    reason: null
  };
}
