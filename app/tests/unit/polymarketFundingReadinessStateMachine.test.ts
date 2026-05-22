import { describe, expect, it } from "vitest";
import { resolveFundingReadinessState } from "@/lib/polymarket/funding-readiness-state-machine";

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
});
