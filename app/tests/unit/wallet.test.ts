import { describe, expect, it } from "vitest";
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
});
