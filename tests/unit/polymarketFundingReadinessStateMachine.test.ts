import { describe, expect, it } from "vitest";
import {
  resolveFundingReadinessState,
  resolveFundingStateModel,
  type FundingStateModelInput
} from "@/lib/polymarket/funding-readiness-state-machine";

const baseModelInput: FundingStateModelInput = {
  walletConnected: true,
  walletChainSupported: true,
  depositWalletAvailable: true,
  depositWalletDeployed: true,
  pusdBalanceAvailable: true,
  pusdBalancePositive: true,
  clobBalanceAllowanceAvailable: true,
  clobBalanceReady: true,
  clobAllowanceReady: true,
  approvalPlanAvailable: false,
  liveTopUpEnabled: true,
  killSwitchActive: false
};

describe("funding readiness state machine", () => {
  it("requires wallet before credentials or collateral", () => {
    expect(
      resolveFundingReadinessState({
        walletConnected: false,
        credentialsReady: false,
        collateralReady: false,
        upstreamAvailable: true
      }).state
    ).toBe("connect_wallet");
  });

  it("only returns ready when all real prerequisites are ready", () => {
    expect(
      resolveFundingReadinessState({
        walletConnected: true,
        credentialsReady: true,
        collateralReady: true,
        upstreamAvailable: true
      }).canTrade
    ).toBe(true);
  });

  it("tracks disconnected and wrong-chain states before funding readiness", () => {
    expect(
      resolveFundingStateModel({
        ...baseModelInput,
        walletConnected: false
      }).flags
    ).toContain("disconnected");

    const wrongChain = resolveFundingStateModel({
      ...baseModelInput,
      walletChainSupported: false
    });

    expect(wrongChain.flags).toContain("wrong_chain");
    expect(wrongChain.readyForLiveTopUp).toBe(false);
  });

  it("does not treat a derived deposit wallet address as deployed status", () => {
    const unknownDeployment = resolveFundingStateModel({
      ...baseModelInput,
      depositWalletAvailable: true,
      depositWalletDeployed: null
    });
    const notDeployed = resolveFundingStateModel({
      ...baseModelInput,
      depositWalletAvailable: true,
      depositWalletDeployed: false
    });

    expect(unknownDeployment.flags).toContain("deposit_wallet_derived");
    expect(unknownDeployment.flags).toContain("deposit_wallet_unavailable");
    expect(unknownDeployment.flags).not.toContain("deposit_wallet_deployed");
    expect(unknownDeployment.readyForLiveTopUp).toBe(false);
    expect(notDeployed.flags).toContain("deposit_wallet_not_deployed");
    expect(notDeployed.readyForLiveTopUp).toBe(false);
  });

  it("keeps pUSD and CLOB unavailable states separate from real zero values", () => {
    const model = resolveFundingStateModel({
      ...baseModelInput,
      pusdBalanceAvailable: false,
      pusdBalancePositive: false,
      clobBalanceAllowanceAvailable: false,
      clobBalanceReady: false,
      clobAllowanceReady: false
    });

    expect(model.flags).toContain("pusd_balance_unavailable");
    expect(model.flags).toContain("clob_balance_allowance_unavailable");
    expect(model.flags).not.toContain("pusd_balance_real");
    expect(model.flags).not.toContain("clob_balance_allowance_real");
    expect(model.spendableCollateralReady).toBe(false);
  });

  it("distinguishes exact approval needed, approval plan availability, and no-approval state", () => {
    const needsApproval = resolveFundingStateModel({
      ...baseModelInput,
      clobAllowanceReady: false,
      approvalPlanAvailable: true
    });
    const noApprovalNeeded = resolveFundingStateModel(baseModelInput);

    expect(needsApproval.flags).toContain("exact_approval_needed");
    expect(needsApproval.flags).toContain("approval_plan_available");
    expect(needsApproval.flags).toContain("approval_submit_blocked");
    expect(noApprovalNeeded.flags).toContain("approval_not_needed");
    expect(noApprovalNeeded.flags).not.toContain("exact_approval_needed");
  });

  it("requires live top-up gates and kill switch clearance for ready_for_live_topup", () => {
    const disabled = resolveFundingStateModel({
      ...baseModelInput,
      liveTopUpEnabled: false
    });
    const killed = resolveFundingStateModel({
      ...baseModelInput,
      killSwitchActive: true
    });
    const ready = resolveFundingStateModel(baseModelInput);

    expect(disabled.flags).toContain("live_topup_disabled");
    expect(disabled.flags).toContain("approval_submit_blocked");
    expect(killed.flags).toContain("kill_switch_active");
    expect(killed.readyForLiveTopUp).toBe(false);
    expect(ready.flags).toContain("ready_for_live_topup");
    expect(ready.readyForLiveTopUp).toBe(true);
    expect(ready.approvalSubmitBlocked).toBe(false);
  });
});
