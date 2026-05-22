import { describe, expect, it } from "vitest";
import { buildPortfolioViewModel } from "@/features/prediction/portfolio/adapter";

describe("account portfolio view model", () => {
  it("does not synthesize positions for disconnected wallets", async () => {
    const vm = await buildPortfolioViewModel({});

    expect(vm.status).toBe("disconnected");
    expect(vm.positions).toEqual([]);
    expect(vm.fills).toEqual([]);
    expect(vm.pnl.status).toBe("unavailable");
  });
});
