import { describe, expect, it } from "vitest";
import { buildFundingPanelViewModel } from "@/features/prediction/funding/adapter";

describe("funding flow adapter", () => {
  it("does not claim withdrawal success without a signed transaction path", async () => {
    const vm = await buildFundingPanelViewModel();

    expect(vm.withdraw.status).toBe("unsupported_withdrawal_path");
  });

  it("does not invent top-up readiness without a connected wallet", async () => {
    const vm = await buildFundingPanelViewModel();

    expect(vm.liveTopUp.readiness.topUpReady).toBe(false);
    expect(vm.liveTopUp.depositWallet.status).toBe("unavailable");
  });
});
