import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { readDepositWalletClobBalanceAllowance } from "@/lib/polymarket/balance-allowance";
import {
  buildDepositWalletSnapshot,
  derivePolymarketDepositWalletAddress
} from "@/lib/polymarket/deposit-wallet";
import {
  buildDepositWalletApprovalPlan,
  buildDepositWalletApprovalPreview,
  buildSignedDepositWalletApprovalPayload,
  buildDepositWalletPusdApprovalCall
} from "@/lib/polymarket/deposit-wallet-approval";
import { POST as postApprovalSubmit } from "@/app/api/polymarket/deposit-wallet/approval-submit/route";

const owner = "0x000000000000000000000000000000000000beef";
const liveTopUpEnvKeys = [
  "POLYMARKET_LIVE_TOP_UP_ENABLED",
  "RELAYER_URL",
  "POLYGON_RPC_URL",
  "CLOB_API_KEY",
  "CLOB_SECRET",
  "CLOB_PASS_PHRASE",
  "CLOB_API_URL"
] as const;
let previousEnv: Record<string, string | undefined> = {};

describe("deposit wallet foundation", () => {
  beforeEach(() => {
    previousEnv = Object.fromEntries(
      liveTopUpEnvKeys.map((key) => [key, process.env[key]])
    );
    process.env.POLYMARKET_LIVE_TOP_UP_ENABLED = "false";
    for (const key of liveTopUpEnvKeys.filter((key) => key !== "POLYMARKET_LIVE_TOP_UP_ENABLED")) {
      delete process.env[key];
    }
  });

  afterEach(() => {
    for (const key of liveTopUpEnvKeys) {
      const value = previousEnv[key];
      if (value === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = value;
      }
    }
  });

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

  it("previews exact approval amount only without enabling submit", () => {
    const preview = buildDepositWalletApprovalPreview({
      ownerAddress: owner,
      amountBaseUnits: "1000000"
    });

    expect(preview.status).toBe("ready");
    if (preview.status === "ready") {
      expect(preview.amountBaseUnits).toBe("1000000");
      expect(preview.calls).toHaveLength(1);
      expect(preview.calls[0].value).toBe("0");
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

  it("does not build a signed approval payload when live top-up gates are closed", () => {
    const call = buildDepositWalletPusdApprovalCall({ amountBaseUnits: "1000000" });

    expect(() =>
      buildSignedDepositWalletApprovalPayload({
        ownerAddress: owner,
        depositWalletAddress: owner,
        nonce: "1",
        deadline: "9999999999",
        signature: `0x${"1".repeat(130)}`,
        calls: [call],
        amountBaseUnits: "1000000"
      })
    ).toThrow("disabled");
  });

  it("blocks approval submit without live env gates", async () => {
    const call = buildDepositWalletPusdApprovalCall({ amountBaseUnits: "1000000" });
    const response = await postApprovalSubmit(
      new Request("http://localhost/api/polymarket/deposit-wallet/approval-submit", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          ownerAddress: owner,
          depositWalletAddress: owner,
          nonce: "1",
          deadline: "9999999999",
          signature: `0x${"1".repeat(130)}`,
          calls: [call],
          amountBaseUnits: "1000000"
        })
      })
    );
    const payload = await response.json();

    expect(response.status).toBe(403);
    expect(payload.status).toBe("blocked");
    expect(payload.code).toBe("disabled");
  });
});
