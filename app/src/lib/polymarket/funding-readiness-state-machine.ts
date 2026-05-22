export type FundingReadinessInput = {
  walletConnected: boolean;
  credentialsReady: boolean;
  collateralReady: boolean;
  upstreamAvailable: boolean;
};

export type FundingStateModelFlag =
  | "disconnected"
  | "wrong_chain"
  | "deposit_wallet_unavailable"
  | "deposit_wallet_derived"
  | "deposit_wallet_not_deployed"
  | "deposit_wallet_deployed"
  | "pusd_balance_unavailable"
  | "pusd_balance_real"
  | "clob_balance_allowance_unavailable"
  | "clob_balance_allowance_real"
  | "approval_not_needed"
  | "exact_approval_needed"
  | "approval_plan_available"
  | "approval_submit_blocked"
  | "live_topup_disabled"
  | "kill_switch_active"
  | "ready_for_live_topup";

export type FundingStateModelInput = {
  walletConnected: boolean;
  walletChainSupported?: boolean | null;
  depositWalletAvailable: boolean;
  depositWalletDeployed: boolean | null;
  pusdBalanceAvailable: boolean;
  pusdBalancePositive: boolean;
  clobBalanceAllowanceAvailable: boolean;
  clobBalanceReady: boolean;
  clobAllowanceReady: boolean;
  approvalPlanAvailable: boolean;
  liveTopUpEnabled: boolean;
  killSwitchActive: boolean;
};

export type FundingStateModel = {
  flags: FundingStateModelFlag[];
  readyForLiveTopUp: boolean;
  approvalSubmitBlocked: boolean;
  spendableCollateralReady: boolean;
  primaryBlocker: Exclude<FundingStateModelFlag, "ready_for_live_topup"> | null;
};

function pushFlag(flags: FundingStateModelFlag[], flag: FundingStateModelFlag) {
  if (!flags.includes(flag)) {
    flags.push(flag);
  }
}

export function resolveFundingStateModel(
  input: FundingStateModelInput
): FundingStateModel {
  const flags: FundingStateModelFlag[] = [];

  if (!input.walletConnected) {
    pushFlag(flags, "disconnected");
  } else if (input.walletChainSupported === false) {
    pushFlag(flags, "wrong_chain");
  }

  if (!input.depositWalletAvailable) {
    pushFlag(flags, "deposit_wallet_unavailable");
  } else {
    pushFlag(flags, "deposit_wallet_derived");
    if (input.depositWalletDeployed === true) {
      pushFlag(flags, "deposit_wallet_deployed");
    } else if (input.depositWalletDeployed === false) {
      pushFlag(flags, "deposit_wallet_not_deployed");
    } else {
      pushFlag(flags, "deposit_wallet_unavailable");
    }
  }

  if (input.pusdBalanceAvailable) {
    pushFlag(flags, "pusd_balance_real");
  } else {
    pushFlag(flags, "pusd_balance_unavailable");
  }

  if (input.clobBalanceAllowanceAvailable) {
    pushFlag(flags, "clob_balance_allowance_real");
    if (input.clobAllowanceReady) {
      pushFlag(flags, "approval_not_needed");
    } else {
      pushFlag(flags, "exact_approval_needed");
    }
  } else {
    pushFlag(flags, "clob_balance_allowance_unavailable");
  }

  if (
    flags.includes("exact_approval_needed") &&
    input.approvalPlanAvailable
  ) {
    pushFlag(flags, "approval_plan_available");
  }

  if (!input.liveTopUpEnabled) {
    pushFlag(flags, "live_topup_disabled");
  }
  if (input.killSwitchActive) {
    pushFlag(flags, "kill_switch_active");
  }

  const spendableCollateralReady =
    input.clobBalanceAllowanceAvailable &&
    input.clobBalanceReady &&
    input.clobAllowanceReady;
  const readyForLiveTopUp =
    input.walletConnected &&
    input.walletChainSupported !== false &&
    input.depositWalletAvailable &&
    input.depositWalletDeployed === true &&
    input.pusdBalanceAvailable &&
    input.pusdBalancePositive &&
    spendableCollateralReady &&
    input.liveTopUpEnabled &&
    !input.killSwitchActive;

  if (readyForLiveTopUp) {
    pushFlag(flags, "ready_for_live_topup");
  } else {
    pushFlag(flags, "approval_submit_blocked");
  }

  const blockerOrder: Array<Exclude<FundingStateModelFlag, "ready_for_live_topup">> = [
    "disconnected",
    "wrong_chain",
    "deposit_wallet_unavailable",
    "deposit_wallet_not_deployed",
    "pusd_balance_unavailable",
    "clob_balance_allowance_unavailable",
    "exact_approval_needed",
    "approval_submit_blocked",
    "live_topup_disabled",
    "kill_switch_active"
  ];
  const primaryBlocker =
    blockerOrder.find((flag) => flags.includes(flag)) ?? null;

  return {
    flags,
    readyForLiveTopUp,
    approvalSubmitBlocked: !readyForLiveTopUp,
    spendableCollateralReady,
    primaryBlocker
  };
}

export type FundingReadinessState =
  | {
      state: "connect_wallet";
      canTrade: false;
      nextAction: "connect_wallet";
    }
  | {
      state: "setup_credentials";
      canTrade: false;
      nextAction: "setup_credentials";
    }
  | {
      state: "add_collateral";
      canTrade: false;
      nextAction: "add_funds";
    }
  | {
      state: "ready";
      canTrade: true;
      nextAction: "trade";
    }
  | {
      state: "unavailable";
      canTrade: false;
      nextAction: "retry";
    };

export function resolveFundingReadinessState(
  input: FundingReadinessInput
): FundingReadinessState {
  if (!input.upstreamAvailable) {
    return { state: "unavailable", canTrade: false, nextAction: "retry" };
  }

  if (!input.walletConnected) {
    return { state: "connect_wallet", canTrade: false, nextAction: "connect_wallet" };
  }

  if (!input.credentialsReady) {
    return {
      state: "setup_credentials",
      canTrade: false,
      nextAction: "setup_credentials"
    };
  }

  if (!input.collateralReady) {
    return { state: "add_collateral", canTrade: false, nextAction: "add_funds" };
  }

  return { state: "ready", canTrade: true, nextAction: "trade" };
}
