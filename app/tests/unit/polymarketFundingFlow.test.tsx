import { describe, expect, it } from "vitest";
import { buildFundingPanelViewModel } from "@/features/prediction/funding/adapter";

describe("funding flow adapter", () => {
  it("does not claim withdrawal success without a signed transaction path", () => {
    const vm = buildFundingPanelViewModel();

    expect(vm.withdraw.status).toBe("unsupported_withdrawal_path");
  });
});
