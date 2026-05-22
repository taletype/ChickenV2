import "server-only";
import { resolveWalletAccount } from "@/lib/wallet/account";
import type { WalletAccountState } from "@/lib/wallet/account";
import {
  readDepositWalletClobBalanceAllowance,
  type BalanceAllowanceSnapshot
} from "./balance-allowance";
import {
  buildDepositWalletApprovalPreview,
  type DepositWalletApprovalPreview
} from "./deposit-wallet-approval";
import {
  buildDepositWalletSnapshot,
  hasPositiveBalance,
  readPusdBalanceSnapshot,
  type DepositWalletSnapshot,
  type TokenBalanceSnapshot
} from "./deposit-wallet";
import { PUSD_DECIMALS } from "./contracts";
import {
  resolveFundingStateModel,
  type FundingStateModel
} from "./funding-readiness-state-machine";
import { getLiveTopUpEnvStatus, type LiveTopUpEnvStatus } from "./live-topup-env";

export type LiveTopUpPublicEnvStatus = {
  status: LiveTopUpEnvStatus["status"];
  enabled: boolean;
  killSwitchActive: boolean;
  configured: boolean;
  reason: "ready" | Exclude<LiveTopUpEnvStatus, { status: "ready" }>["reason"];
  missing: readonly string[];
  invalid: readonly string[];
};

export type LiveTopUpStep =
  | "connect_wallet"
  | "deposit_wallet_unavailable"
  | "deploy_deposit_wallet"
  | "top_up_required"
  | "balance_allowance_unavailable"
  | "sync_clob_balance"
  | "approval_required"
  | "ready";

export type LiveTopUpFundingSnapshot = {
  account: WalletAccountState;
  env: LiveTopUpPublicEnvStatus;
  depositWallet: DepositWalletSnapshot;
  balances: {
    connectedWalletPusd: TokenBalanceSnapshot;
    depositWalletPusd: TokenBalanceSnapshot;
    clob: BalanceAllowanceSnapshot;
  };
  approvalPreview: DepositWalletApprovalPreview;
  readiness: {
    step: LiveTopUpStep;
    topUpReady: boolean;
    readyForLiveTopUp: boolean;
    canSubmitLiveOrder: boolean;
    stateModel: FundingStateModel;
    checkedAt: string;
    checklist: Array<{
      id:
        | "wallet"
        | "deposit_wallet_address"
        | "deposit_wallet_deployed"
        | "deposit_wallet_pusd"
        | "clob_balance"
        | "clob_allowance"
        | "live_top_up_gate";
      label: string;
      state: "ready" | "blocked" | "unavailable";
    }>;
  };
};

function publicEnvStatus(env: LiveTopUpEnvStatus): LiveTopUpPublicEnvStatus {
  if (env.status === "ready") {
    return {
      status: "ready",
      enabled: true,
      killSwitchActive: false,
      configured: true,
      reason: "ready",
      missing: [],
      invalid: []
    };
  }

  return {
    status: "blocked",
    enabled: env.enabled,
    killSwitchActive: env.killSwitchActive,
    configured: env.missing.length === 0 && env.invalid.length === 0,
    reason: env.reason,
    missing: env.missing,
    invalid: env.invalid
  };
}

function resolveStep(input: {
  account: WalletAccountState;
  depositWallet: DepositWalletSnapshot;
  depositWalletPusd: TokenBalanceSnapshot;
  clob: BalanceAllowanceSnapshot;
}): LiveTopUpStep {
  if (input.account.status !== "connected") {
    return "connect_wallet";
  }
  if (input.depositWallet.status !== "available") {
    return "deposit_wallet_unavailable";
  }
  if (input.depositWallet.deployed === null) {
    return "deposit_wallet_unavailable";
  }
  if (!input.depositWallet.deployed) {
    return "deploy_deposit_wallet";
  }
  if (!hasPositiveBalance(input.depositWalletPusd)) {
    return "top_up_required";
  }
  if (input.clob.status !== "available") {
    return "balance_allowance_unavailable";
  }
  if (!input.clob.balanceReady) {
    return "sync_clob_balance";
  }
  if (!input.clob.allowanceReady) {
    return "approval_required";
  }
  return "ready";
}

function stateFromBoolean(value: boolean, unavailable = false) {
  if (unavailable) {
    return "unavailable" as const;
  }
  return value ? ("ready" as const) : ("blocked" as const);
}

function requiredAmountBaseUnits(requiredAmount: number | undefined) {
  const amount =
    typeof requiredAmount === "number" &&
    Number.isFinite(requiredAmount) &&
    requiredAmount > 0
      ? requiredAmount
      : 1;
  return String(Math.ceil(amount * 10 ** PUSD_DECIMALS));
}

export async function buildLiveTopUpFundingSnapshot(input: {
  address?: string | null;
  requiredAmount?: number;
}): Promise<LiveTopUpFundingSnapshot> {
  const account = resolveWalletAccount(input.address);
  const env = getLiveTopUpEnvStatus();
  const depositWallet = await buildDepositWalletSnapshot(account.address);
  const depositWalletAddress =
    depositWallet.status === "available" ? depositWallet.depositWalletAddress : null;
  const [connectedWalletPusd, depositWalletPusd, clob] = await Promise.all([
    readPusdBalanceSnapshot(account.address),
    readPusdBalanceSnapshot(depositWalletAddress),
    readDepositWalletClobBalanceAllowance({
      ownerAddress: account.address,
      depositWalletAddress,
      requiredAmount: input.requiredAmount
    })
  ]);
  const step = resolveStep({
    account,
    depositWallet,
    depositWalletPusd,
    clob
  });
  const topUpReady = step === "ready";
  const approvalPreview = buildDepositWalletApprovalPreview({
    ownerAddress: account.address,
    amountBaseUnits: requiredAmountBaseUnits(input.requiredAmount)
  });
  const stateModel = resolveFundingStateModel({
    walletConnected: account.status === "connected",
    walletChainSupported: null,
    depositWalletAvailable: depositWallet.status === "available",
    depositWalletDeployed:
      depositWallet.status === "available" ? depositWallet.deployed : null,
    pusdBalanceAvailable: depositWalletPusd.status === "available",
    pusdBalancePositive: hasPositiveBalance(depositWalletPusd),
    clobBalanceAllowanceAvailable: clob.status === "available",
    clobBalanceReady: clob.status === "available" && clob.balanceReady,
    clobAllowanceReady: clob.status === "available" && clob.allowanceReady,
    approvalPlanAvailable: approvalPreview.status === "ready",
    liveTopUpEnabled: env.status === "ready",
    killSwitchActive: env.killSwitchActive
  });

  return {
    account,
    env: publicEnvStatus(env),
    depositWallet,
    balances: {
      connectedWalletPusd,
      depositWalletPusd,
      clob
    },
    approvalPreview,
    readiness: {
      step,
      topUpReady,
      readyForLiveTopUp: stateModel.readyForLiveTopUp,
      canSubmitLiveOrder: stateModel.readyForLiveTopUp,
      stateModel,
      checkedAt: new Date().toISOString(),
      checklist: [
        {
          id: "wallet",
          label: "Connected wallet",
          state: stateFromBoolean(account.status === "connected")
        },
        {
          id: "deposit_wallet_address",
          label: "Deposit wallet address",
          state: stateFromBoolean(depositWallet.status === "available")
        },
        {
          id: "deposit_wallet_deployed",
          label: "Deposit wallet deployed",
          state: stateFromBoolean(
            depositWallet.status === "available" && depositWallet.deployed === true,
            depositWallet.status !== "available" || depositWallet.deployed === null
          )
        },
        {
          id: "deposit_wallet_pusd",
          label: "Deposit wallet pUSD",
          state: stateFromBoolean(
            hasPositiveBalance(depositWalletPusd),
            depositWalletPusd.status !== "available"
          )
        },
        {
          id: "clob_balance",
          label: "CLOB balance sync",
          state: stateFromBoolean(
            clob.status === "available" && clob.balanceReady,
            clob.status !== "available"
          )
        },
        {
          id: "clob_allowance",
          label: "CLOB allowance",
          state: stateFromBoolean(
            clob.status === "available" && clob.allowanceReady,
            clob.status !== "available"
          )
        },
        {
          id: "live_top_up_gate",
          label: "Live top-up gate",
          state: stateFromBoolean(env.status === "ready")
        }
      ]
    }
  };
}
