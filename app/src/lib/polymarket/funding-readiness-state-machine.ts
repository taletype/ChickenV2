export type FundingReadinessInput = {
  walletConnected: boolean;
  credentialsReady: boolean;
  collateralReady: boolean;
  upstreamAvailable: boolean;
};

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
