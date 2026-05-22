import "server-only";
import type { DepositWalletBatchRequest, DepositWalletCall } from "@polymarket/builder-relayer-client";
import { decodeFunctionData, encodeFunctionData, erc20Abi, maxUint256 } from "viem";
import { normalizeEvmAddress, type EvmAddress } from "@/lib/wallet/address";
import {
  CTF_EXCHANGE_V2_ADDRESS,
  NEG_RISK_CTF_EXCHANGE_V2_ADDRESS,
  POLYGON_CHAIN_ID
} from "./contracts";
import { derivePolymarketDepositWalletAddress } from "./deposit-wallet";
import {
  assertLiveTopUpMutationAllowed,
  getLiveTopUpEnvStatus
} from "./live-topup-env";

export const DEPOSIT_WALLET_APPROVAL_SPENDERS = [
  CTF_EXCHANGE_V2_ADDRESS,
  NEG_RISK_CTF_EXCHANGE_V2_ADDRESS
] as const;

export type DepositWalletApprovalPlan =
  | {
      status: "ready";
      ownerAddress: EvmAddress;
      depositWalletAddress: EvmAddress;
      amountBaseUnits: string;
      spenderAddress: EvmAddress;
      tokenAddress: EvmAddress;
      nonce: string;
      deadline: string;
      calls: DepositWalletCall[];
      typedData: {
        domain: {
          name: "DepositWallet";
          version: "1";
          chainId: typeof POLYGON_CHAIN_ID;
          verifyingContract: EvmAddress;
        };
        types: {
          Call: Array<{ name: "target" | "value" | "data"; type: string }>;
          Batch: Array<{ name: "wallet" | "nonce" | "deadline" | "calls"; type: string }>;
        };
        primaryType: "Batch";
        message: {
          wallet: EvmAddress;
          nonce: string;
          deadline: string;
          calls: DepositWalletCall[];
        };
      };
    }
  | {
      status: "blocked";
      code:
        | "disabled"
        | "kill_switch_active"
        | "missing_required_env"
        | "invalid_required_env"
        | "missing_wallet"
        | "missing_deposit_wallet"
        | "invalid_amount"
        | "invalid_spender"
        | "nonce_unavailable";
      missing?: readonly string[];
      invalid?: readonly string[];
    };

function parsePositiveBaseUnits(value: string | bigint | number | null | undefined) {
  if (typeof value === "bigint") {
    return value > 0n && value !== maxUint256 ? value : null;
  }
  const raw = String(value ?? "").trim();
  if (!/^\d+$/.test(raw)) {
    return null;
  }
  const amount = BigInt(raw);
  return amount > 0n && amount !== maxUint256 ? amount : null;
}

function resolveApprovalSpender(value: string | null | undefined) {
  const spender = normalizeEvmAddress(value) ?? CTF_EXCHANGE_V2_ADDRESS;
  return DEPOSIT_WALLET_APPROVAL_SPENDERS.includes(
    spender as (typeof DEPOSIT_WALLET_APPROVAL_SPENDERS)[number]
  )
    ? spender
    : null;
}

export function buildDepositWalletPusdApprovalCall(input: {
  amountBaseUnits: string | bigint | number;
  spenderAddress?: string | null;
}): DepositWalletCall {
  const env = getLiveTopUpEnvStatus();
  const amount = parsePositiveBaseUnits(input.amountBaseUnits);
  const spender = resolveApprovalSpender(input.spenderAddress);
  if (!amount) {
    throw new Error("invalid_amount");
  }
  if (!spender) {
    throw new Error("invalid_spender");
  }
  if (!env.config.pusdAddress) {
    throw new Error("missing_pusd_address");
  }

  return {
    target: env.config.pusdAddress,
    value: "0",
    data: encodeFunctionData({
      abi: erc20Abi,
      functionName: "approve",
      args: [spender, amount]
    })
  };
}

export function validateDepositWalletPusdApprovalCall(input: {
  call: DepositWalletCall;
  amountBaseUnits: string | bigint | number;
  spenderAddress?: string | null;
}) {
  const env = getLiveTopUpEnvStatus();
  const amount = parsePositiveBaseUnits(input.amountBaseUnits);
  const spender = resolveApprovalSpender(input.spenderAddress);
  const target = normalizeEvmAddress(input.call.target);
  if (!amount) {
    throw new Error("invalid_amount");
  }
  if (!spender) {
    throw new Error("invalid_spender");
  }
  if (!target || target !== env.config.pusdAddress) {
    throw new Error("wrong_token");
  }
  if (input.call.value !== "0") {
    throw new Error("native_value_rejected");
  }

  const decoded = decodeFunctionData({
    abi: erc20Abi,
    data: input.call.data as `0x${string}`
  });
  if (decoded.functionName !== "approve") {
    throw new Error("unknown_selector");
  }

  const [decodedSpender, decodedAmount] = decoded.args;
  if (normalizeEvmAddress(decodedSpender) !== spender) {
    throw new Error("spender_mismatch");
  }
  if (decodedAmount === maxUint256 || decodedAmount !== amount) {
    throw new Error("amount_mismatch");
  }

  return {
    amountBaseUnits: amount.toString(),
    spenderAddress: spender,
    tokenAddress: env.config.pusdAddress,
    call: input.call
  };
}

async function getDepositWalletNonce(ownerAddress: EvmAddress) {
  const gate = assertLiveTopUpMutationAllowed();
  if (gate.status !== "ready") {
    return null;
  }

  const url = new URL(`${gate.config.relayerUrl}/nonce`);
  url.searchParams.set("address", ownerAddress);
  url.searchParams.set("type", "WALLET");
  const response = await fetch(url, {
    cache: "no-store",
    headers: { accept: "application/json" }
  }).catch(() => null);
  if (!response?.ok) {
    return null;
  }
  const payload = (await response.json().catch(() => null)) as
    | { nonce?: unknown }
    | null;
  return typeof payload?.nonce === "string" && /^\d+$/.test(payload.nonce)
    ? payload.nonce
    : null;
}

export async function buildDepositWalletApprovalPlan(input: {
  ownerAddress: string | null | undefined;
  amountBaseUnits: string | bigint | number | null | undefined;
  spenderAddress?: string | null;
  deadlineSeconds?: number;
}): Promise<DepositWalletApprovalPlan> {
  const gate = assertLiveTopUpMutationAllowed();
  if (gate.status !== "ready") {
    return {
      status: "blocked",
      code: gate.reason,
      missing: gate.missing,
      invalid: gate.invalid
    };
  }

  const ownerAddress = normalizeEvmAddress(input.ownerAddress);
  if (!ownerAddress) {
    return { status: "blocked", code: "missing_wallet" };
  }

  const depositWalletAddress = derivePolymarketDepositWalletAddress(ownerAddress);
  if (!depositWalletAddress) {
    return { status: "blocked", code: "missing_deposit_wallet" };
  }

  const amount = parsePositiveBaseUnits(input.amountBaseUnits);
  const spenderAddress = resolveApprovalSpender(input.spenderAddress);
  if (!amount) {
    return { status: "blocked", code: "invalid_amount" };
  }
  if (!spenderAddress) {
    return { status: "blocked", code: "invalid_spender" };
  }

  const nonce = await getDepositWalletNonce(ownerAddress);
  if (!nonce) {
    return { status: "blocked", code: "nonce_unavailable" };
  }

  const deadline = String(
    input.deadlineSeconds ?? Math.floor(Date.now() / 1000) + 10 * 60
  );
  const calls = [
    buildDepositWalletPusdApprovalCall({
      amountBaseUnits: amount,
      spenderAddress
    })
  ];
  const [call] = calls;
  const validation = validateDepositWalletPusdApprovalCall({
    call,
    amountBaseUnits: amount,
    spenderAddress
  });

  return {
    status: "ready",
    ownerAddress,
    depositWalletAddress,
    amountBaseUnits: validation.amountBaseUnits,
    spenderAddress,
    tokenAddress: validation.tokenAddress,
    nonce,
    deadline,
    calls,
    typedData: {
      domain: {
        name: "DepositWallet",
        version: "1",
        chainId: POLYGON_CHAIN_ID,
        verifyingContract: depositWalletAddress
      },
      types: {
        Call: [
          { name: "target", type: "address" },
          { name: "value", type: "uint256" },
          { name: "data", type: "bytes" }
        ],
        Batch: [
          { name: "wallet", type: "address" },
          { name: "nonce", type: "uint256" },
          { name: "deadline", type: "uint256" },
          { name: "calls", type: "Call[]" }
        ]
      },
      primaryType: "Batch",
      message: {
        wallet: depositWalletAddress,
        nonce,
        deadline,
        calls
      }
    }
  };
}

export function buildSignedDepositWalletApprovalPayload(input: {
  ownerAddress: string;
  depositWalletAddress: string;
  nonce: string;
  deadline: string;
  signature: string;
  calls: DepositWalletCall[];
  amountBaseUnits: string | bigint | number;
  spenderAddress?: string | null;
}): DepositWalletBatchRequest {
  const gate = assertLiveTopUpMutationAllowed();
  if (gate.status !== "ready") {
    throw new Error(gate.reason);
  }
  const ownerAddress = normalizeEvmAddress(input.ownerAddress);
  const depositWalletAddress = normalizeEvmAddress(input.depositWalletAddress);
  if (!ownerAddress || !depositWalletAddress) {
    throw new Error("missing_wallet");
  }
  if (input.calls.length !== 1) {
    throw new Error("approval_batch_must_contain_one_call");
  }
  validateDepositWalletPusdApprovalCall({
    call: input.calls[0],
    amountBaseUnits: input.amountBaseUnits,
    spenderAddress: input.spenderAddress
  });

  return {
    type: "WALLET",
    from: ownerAddress,
    to: gate.config.depositWalletFactoryAddress,
    nonce: input.nonce,
    signature: input.signature,
    depositWalletParams: {
      depositWallet: depositWalletAddress,
      deadline: input.deadline,
      calls: input.calls
    }
  };
}
