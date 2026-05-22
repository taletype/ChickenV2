import { listAddFundsMethods } from "@/lib/funding/methods";
import { buildFundingReadinessViewModel } from "@/lib/polymarket/funding-readiness";
import { resolveWalletAccount } from "@/lib/wallet/account";

export function buildFundingPanelViewModel(address?: string | null) {
  const account = resolveWalletAccount(address);

  return {
    account,
    readiness: buildFundingReadinessViewModel({
      walletConnected: account.status === "connected"
    }),
    methods: listAddFundsMethods(),
    withdraw: {
      status: "unsupported_withdrawal_path" as const
    }
  };
}
