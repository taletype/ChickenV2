import { describe, expect, it } from "vitest";
import { listAddFundsMethods } from "@/lib/funding/methods";

describe("add funds methods", () => {
  it("uses the official portfolio handoff as a real method", () => {
    const methods = listAddFundsMethods();

    expect(methods[0]?.href).toContain("polymarket.com/portfolio");
    expect(methods[0]?.asset).toBe("USDC");
  });
});
