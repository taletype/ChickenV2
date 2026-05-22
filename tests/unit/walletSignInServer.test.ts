import { describe, expect, it } from "vitest";
import { resolveWalletSessionFromAddress } from "@/lib/wallet/session";

describe("wallet sign-in server bridge", () => {
  it("stays unauthenticated without a real address", () => {
    expect(resolveWalletSessionFromAddress(undefined)).toEqual({
      authenticated: false,
      address: null,
      source: "missing"
    });
  });

  it("accepts query-provided wallet identity", () => {
    const session = resolveWalletSessionFromAddress(
      "0x000000000000000000000000000000000000BEEF"
    );

    expect(session.authenticated).toBe(true);
    expect(session.address).toBe("0x000000000000000000000000000000000000beef");
  });
});
