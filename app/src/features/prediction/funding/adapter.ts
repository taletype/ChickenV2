import { listAddFundsMethods } from "@/lib/funding/methods";
import { buildFundingReadinessViewModel } from "@/lib/polymarket/funding-readiness";
import { buildLiveTopUpFundingSnapshot } from "@/lib/polymarket/live-topup-status";

export async function buildFundingPanelViewModel(address?: string | null) {
  const liveTopUp = await buildLiveTopUpFundingSnapshot({ address });

  return {
    account: liveTopUp.account,
    liveTopUp,
    readiness: buildFundingReadinessViewModel({
      walletConnected: liveTopUp.account.status === "connected",
      credentialsReady: liveTopUp.env.status === "ready",
      collateralReady: liveTopUp.readiness.topUpReady,
      upstreamAvailable:
        liveTopUp.depositWallet.status === "available" &&
        liveTopUp.depositWallet.deployed !== null
    }),
    methods: listAddFundsMethods(),
    withdraw: {
      status: "unsupported_withdrawal_path" as const
    }
  };
}
