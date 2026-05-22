import { describe, expect, it } from "vitest";
import { readDepositWalletClobBalanceAllowance } from "@/lib/polymarket/balance-allowance";
import {
  buildDepositWalletSnapshot,
  derivePolymarketDepositWalletAddress
} from "@/lib/polymarket/deposit-wallet";
import {
  buildDepositWalletApprovalPlan,
  buildDepositWalletPusdApprovalCall
} from "@/lib/polymarket/deposit-wallet-approval";

const owner = "0x000000000000000000000000000000000000beef";

describe("deposit wallet foundation", () => {
  it("does not derive a deposit wallet from a missing owner wallet", () => {
    expect(derivePolymarketDepositWalletAddress(null)).toBeNull();
  });

  it("returns an unavailable deposit-wallet state without owner input", async () => {
    const snapshot = await buildDepositWalletSnapshot(null);

    expect(snapshot.status).toBe("unavailable");
    expect(snapshot.deployed).toBeNull();
  });

  it("keeps balance and allowance unavailable without CLOB credentials", async () => {
    const snapshot = await readDepositWalletClobBalanceAllowance({
      ownerAddress: owner,
      depositWalletAddress: owner,
      requiredAmount: 1
    });

    expect(snapshot.status).toBe("unavailable");
    expect(snapshot.balanceReady).toBe(false);
    expect(snapshot.allowanceReady).toBe(false);
  });

  it("blocks approval planning unless live top-up gates and credentials pass", async () => {
    const plan = await buildDepositWalletApprovalPlan({
      ownerAddress: owner,
      amountBaseUnits: "1000000"
    });

    expect(plan.status).toBe("blocked");
    if (plan.status === "blocked") {
      expect(plan.code).toBe("disabled");
    }
  });

  it("rejects unlimited approval amounts", () => {
    expect(() =>
      buildDepositWalletPusdApprovalCall({
        amountBaseUnits:
          "115792089237316195423570985008687907853269984665640564039457584007913129639935"
      })
    ).toThrow("invalid_amount");
  });
});
