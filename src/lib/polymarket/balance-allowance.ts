import "server-only";
import {
  AssetType,
  Chain,
  ClobClient,
  SignatureTypeV2,
  type BalanceAllowanceResponse,
  type ClobClientOptions
} from "@polymarket/clob-client-v2";
import { normalizeEvmAddress, type EvmAddress } from "@/lib/wallet/address";
import {
  assertLiveTopUpMutationAllowed,
  getLiveTopUpClobCredentials,
  getLiveTopUpEnvStatus
} from "./live-topup-env";

export type BalanceAllowanceSnapshot =
  | {
      status: "available";
      asset: "COLLATERAL";
      balance: number;
      allowance: number;
      balanceReady: boolean;
      allowanceReady: boolean;
      checkedAt: string;
    }
  | {
      status: "unavailable";
      asset: "COLLATERAL";
      balance: null;
      allowance: null;
      balanceReady: false;
      allowanceReady: false;
      checkedAt: string;
      reason:
        | "missing_credentials"
        | "missing_wallet"
        | "missing_deposit_wallet"
        | "missing_clob_url"
        | "clob_unavailable";
    };

type BalanceAllowanceUnavailableReason = Extract<
  BalanceAllowanceSnapshot,
  { status: "unavailable" }
>["reason"];

function createAddressOnlySigner(
  walletAddress: EvmAddress
): NonNullable<ClobClientOptions["signer"]> {
  return {
    async getAddress() {
      return walletAddress;
    },
    async _signTypedData() {
      throw new Error("server_wallet_signing_disabled");
    }
  } as NonNullable<ClobClientOptions["signer"]>;
}

function parseAmount(value: unknown) {
  if (typeof value !== "string" && typeof value !== "number") {
    return 0;
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function parseAllowance(response: BalanceAllowanceResponse) {
  const direct = (response as BalanceAllowanceResponse & { allowance?: unknown })
    .allowance;
  if (direct) {
    return parseAmount(direct);
  }

  return Math.max(
    0,
    ...Object.values(response.allowances ?? {}).map((value) => parseAmount(value))
  );
}

function unavailable(reason: BalanceAllowanceUnavailableReason): BalanceAllowanceSnapshot {
  return {
    status: "unavailable",
    asset: "COLLATERAL",
    balance: null,
    allowance: null,
    balanceReady: false,
    allowanceReady: false,
    checkedAt: new Date().toISOString(),
    reason
  };
}

function createDepositWalletClobClient(input: {
  ownerAddress: EvmAddress;
  depositWalletAddress: EvmAddress;
}) {
  const env = getLiveTopUpEnvStatus();
  const credentials = getLiveTopUpClobCredentials();
  if (!credentials) {
    return null;
  }
  if (!env.config.clobApiUrl) {
    return null;
  }

  return new ClobClient({
    host: env.config.clobApiUrl,
    chain: Chain.POLYGON,
    signer: createAddressOnlySigner(input.ownerAddress),
    creds: credentials,
    signatureType: SignatureTypeV2.POLY_1271,
    funderAddress: input.depositWalletAddress,
    throwOnError: true
  });
}

export async function readDepositWalletClobBalanceAllowance(input: {
  ownerAddress: string | null | undefined;
  depositWalletAddress: string | null | undefined;
  requiredAmount?: number;
}): Promise<BalanceAllowanceSnapshot> {
  const ownerAddress = normalizeEvmAddress(input.ownerAddress);
  const depositWalletAddress = normalizeEvmAddress(input.depositWalletAddress);
  if (!ownerAddress) {
    return unavailable("missing_wallet");
  }
  if (!depositWalletAddress) {
    return unavailable("missing_deposit_wallet");
  }
  if (!getLiveTopUpClobCredentials()) {
    return unavailable("missing_credentials");
  }
  if (!getLiveTopUpEnvStatus().config.clobApiUrl) {
    return unavailable("missing_clob_url");
  }

  const client = createDepositWalletClobClient({ ownerAddress, depositWalletAddress });
  if (!client) {
    return unavailable("missing_credentials");
  }

  try {
    const response = await client.getBalanceAllowance({
      asset_type: AssetType.COLLATERAL
    });
    const requiredAmount = input.requiredAmount ?? 0;
    const balance = parseAmount(response.balance);
    const allowance = parseAllowance(response);

    return {
      status: "available",
      asset: "COLLATERAL",
      balance,
      allowance,
      balanceReady: balance >= requiredAmount,
      allowanceReady: allowance >= requiredAmount,
      checkedAt: new Date().toISOString()
    };
  } catch {
    return unavailable("clob_unavailable");
  }
}

export async function syncDepositWalletClobBalanceAllowance(input: {
  ownerAddress: string | null | undefined;
  depositWalletAddress: string | null | undefined;
  requiredAmount?: number;
}) {
  const gate = assertLiveTopUpMutationAllowed();
  if (gate.status !== "ready") {
    return {
      ok: false as const,
      status: "blocked" as const,
      code: gate.reason,
      missing: gate.missing,
      invalid: gate.invalid
    };
  }

  const ownerAddress = normalizeEvmAddress(input.ownerAddress);
  const depositWalletAddress = normalizeEvmAddress(input.depositWalletAddress);
  if (!ownerAddress || !depositWalletAddress) {
    return {
      ok: false as const,
      status: "blocked" as const,
      code: "missing_wallet"
    };
  }

  const client = createDepositWalletClobClient({ ownerAddress, depositWalletAddress });
  if (!client) {
    return {
      ok: false as const,
      status: "blocked" as const,
      code: "missing_credentials"
    };
  }

  try {
    await client.updateBalanceAllowance({
      asset_type: AssetType.COLLATERAL
    });
    const snapshot = await readDepositWalletClobBalanceAllowance({
      ownerAddress,
      depositWalletAddress,
      requiredAmount: input.requiredAmount
    });

    return {
      ok: snapshot.status === "available",
      status: snapshot.status,
      snapshot
    };
  } catch {
    return {
      ok: false as const,
      status: "unavailable" as const,
      code: "clob_unavailable"
    };
  }
}
