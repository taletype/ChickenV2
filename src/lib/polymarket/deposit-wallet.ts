import "server-only";
import { deriveDepositWallet } from "@polymarket/builder-relayer-client";
import { createPublicClient, erc20Abi, formatUnits, http } from "viem";
import { polygon } from "viem/chains";
import { normalizeEvmAddress, shortAddress, type EvmAddress } from "@/lib/wallet/address";
import { PUSD_DECIMALS } from "./contracts";
import {
  getDepositWalletAddressConfig,
  getLiveTopUpEnvStatus
} from "./live-topup-env";

export type TokenBalanceSnapshot =
  | {
      status: "available";
      atoms: string;
      formatted: string;
      checkedAt: string;
    }
  | {
      status: "unavailable";
      atoms: null;
      formatted: null;
      checkedAt: string;
      reason: "missing_wallet" | "missing_rpc_url" | "missing_token" | "rpc_unavailable";
    };

export type DepositWalletSnapshot =
  | {
      status: "available";
      ownerAddress: EvmAddress;
      depositWalletAddress: EvmAddress;
      depositWalletLabel: string;
      deployed: boolean | null;
      deployedStatus: "deployed" | "not_deployed" | "unknown";
      checkedAt: string;
      source: "relayer" | "rpc" | "unavailable";
    }
  | {
      status: "unavailable";
      ownerAddress: EvmAddress | null;
      depositWalletAddress: null;
      depositWalletLabel: null;
      deployed: null;
      deployedStatus: "unknown";
      checkedAt: string;
      source: "unavailable";
      reason: "missing_owner_wallet" | "derivation_unavailable";
    };

export function derivePolymarketDepositWalletAddress(
  ownerAddress: string | null | undefined
): EvmAddress | null {
  const owner = normalizeEvmAddress(ownerAddress);
  if (!owner) {
    return null;
  }

  const { factoryAddress, implementationAddress } = getDepositWalletAddressConfig();
  return normalizeEvmAddress(
    deriveDepositWallet(owner, factoryAddress, implementationAddress)
  );
}

function createRpcClient(rpcUrl: string) {
  return createPublicClient({
    chain: polygon,
    transport: http(rpcUrl)
  });
}

async function checkRelayerWalletDeployed(
  walletAddress: EvmAddress,
  relayerUrl: string | undefined
) {
  if (!relayerUrl) {
    return null;
  }

  const url = new URL(`${relayerUrl}/deployed`);
  url.searchParams.set("address", walletAddress);
  url.searchParams.set("type", "WALLET");
  const response = await fetch(url, {
    cache: "no-store",
    headers: { accept: "application/json" }
  }).catch(() => null);
  if (!response?.ok) {
    return null;
  }

  const payload = (await response.json().catch(() => null)) as
    | { deployed?: unknown }
    | null;
  return typeof payload?.deployed === "boolean" ? payload.deployed : null;
}

async function checkRpcWalletDeployed(
  walletAddress: EvmAddress,
  rpcUrl: string | undefined
) {
  if (!rpcUrl) {
    return null;
  }

  const code = await createRpcClient(rpcUrl)
    .getCode({ address: walletAddress })
    .catch(() => undefined);
  return typeof code === "string" ? code !== "0x" : null;
}

export async function buildDepositWalletSnapshot(
  ownerAddress: string | null | undefined
): Promise<DepositWalletSnapshot> {
  const checkedAt = new Date().toISOString();
  const env = getLiveTopUpEnvStatus();
  const owner = normalizeEvmAddress(ownerAddress);
  if (!owner) {
    return {
      status: "unavailable",
      ownerAddress: null,
      depositWalletAddress: null,
      depositWalletLabel: null,
      deployed: null,
      deployedStatus: "unknown",
      checkedAt,
      source: "unavailable",
      reason: "missing_owner_wallet"
    };
  }

  const depositWalletAddress = derivePolymarketDepositWalletAddress(owner);
  if (!depositWalletAddress) {
    return {
      status: "unavailable",
      ownerAddress: owner,
      depositWalletAddress: null,
      depositWalletLabel: null,
      deployed: null,
      deployedStatus: "unknown",
      checkedAt,
      source: "unavailable",
      reason: "derivation_unavailable"
    };
  }

  const relayerDeployed = await checkRelayerWalletDeployed(
    depositWalletAddress,
    env.config.relayerUrl
  );
  const deployed =
    relayerDeployed ??
    (await checkRpcWalletDeployed(depositWalletAddress, env.config.polygonRpcUrl));

  return {
    status: "available",
    ownerAddress: owner,
    depositWalletAddress,
    depositWalletLabel: shortAddress(depositWalletAddress) ?? depositWalletAddress,
    deployed,
    deployedStatus:
      deployed === true ? "deployed" : deployed === false ? "not_deployed" : "unknown",
    checkedAt,
    source: typeof relayerDeployed === "boolean" ? "relayer" : deployed === null ? "unavailable" : "rpc"
  };
}

export async function readPusdBalanceSnapshot(
  walletAddress: string | null | undefined
): Promise<TokenBalanceSnapshot> {
  const checkedAt = new Date().toISOString();
  const env = getLiveTopUpEnvStatus();
  const wallet = normalizeEvmAddress(walletAddress);
  if (!wallet) {
    return {
      status: "unavailable",
      atoms: null,
      formatted: null,
      checkedAt,
      reason: "missing_wallet"
    };
  }
  if (!env.config.polygonRpcUrl) {
    return {
      status: "unavailable",
      atoms: null,
      formatted: null,
      checkedAt,
      reason: "missing_rpc_url"
    };
  }
  if (!env.config.pusdAddress) {
    return {
      status: "unavailable",
      atoms: null,
      formatted: null,
      checkedAt,
      reason: "missing_token"
    };
  }

  try {
    const atoms = await createRpcClient(env.config.polygonRpcUrl).readContract({
      address: env.config.pusdAddress,
      abi: erc20Abi,
      functionName: "balanceOf",
      args: [wallet]
    });

    return {
      status: "available",
      atoms: atoms.toString(),
      formatted: formatUnits(atoms, PUSD_DECIMALS),
      checkedAt
    };
  } catch {
    return {
      status: "unavailable",
      atoms: null,
      formatted: null,
      checkedAt,
      reason: "rpc_unavailable"
    };
  }
}

export function hasPositiveBalance(balance: TokenBalanceSnapshot) {
  if (balance.status !== "available") {
    return false;
  }
  try {
    return BigInt(balance.atoms) > 0n;
  } catch {
    return Number(balance.formatted) > 0;
  }
}
