import { describe, expect, it } from "vitest";
import { getAppKitReadiness, resolveWalletConnectionState } from "@/lib/wallet/appkit";
import { normalizeEvmAddress, shortAddress } from "@/lib/wallet/address";
import { resolveWalletAccount } from "@/lib/wallet/account";

describe("wallet address helpers", () => {
  it("normalizes valid EVM addresses", () => {
    expect(
      normalizeEvmAddress("0x000000000000000000000000000000000000BEEF")
    ).toBe("0x000000000000000000000000000000000000beef");
  });

  it("rejects invalid addresses", () => {
    expect(normalizeEvmAddress("0x123")).toBeNull();
  });

  it("builds disconnected account state without inventing an address", () => {
    expect(resolveWalletAccount(null)).toEqual({
      status: "disconnected",
      address: null,
      label: null
    });
  });

  it("formats short addresses", () => {
    expect(shortAddress("0x000000000000000000000000000000000000BEEF")).toBe(
      "0x0000...beef"
    );
  });

  it("marks non-Polygon connected wallets as unsupported chain", () => {
    const state = resolveWalletConnectionState({
      readiness: getAppKitReadiness("project"),
      address: "0x000000000000000000000000000000000000BEEF",
      chainId: 1,
      connected: true
    });

    expect(state.status).toBe("unsupported_chain");
    expect(state.reason).toBe("unsupported_chain");
    expect(state.expectedChainId).toBe(137);
  });

  it("stays unconfigured when Reown project id is absent", () => {
    const state = resolveWalletConnectionState({
      readiness: getAppKitReadiness(),
      connected: false
    });

    expect(state.status).toBe("unconfigured");
    expect(state.reason).toBe("missing_project_id");
  });
});
