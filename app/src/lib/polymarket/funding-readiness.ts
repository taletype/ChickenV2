import { resolveFundingReadinessState } from "./funding-readiness-state-machine";

export type FundingReadinessViewModel = ReturnType<typeof resolveFundingReadinessState> & {
  checkedAt: string;
};

export function buildFundingReadinessViewModel(input: {
  walletConnected: boolean;
  credentialsReady?: boolean;
  collateralReady?: boolean;
  upstreamAvailable?: boolean;
}): FundingReadinessViewModel {
  return {
    ...resolveFundingReadinessState({
      walletConnected: input.walletConnected,
      credentialsReady: input.credentialsReady ?? false,
      collateralReady: input.collateralReady ?? false,
      upstreamAvailable: input.upstreamAvailable ?? true
    }),
    checkedAt: new Date().toISOString()
  };
}
