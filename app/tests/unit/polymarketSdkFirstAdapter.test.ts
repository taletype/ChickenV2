import { describe, expect, it } from "vitest";
import { submitViaSdkFirstAdapter } from "@/lib/polymarket/sdk-first";

describe("sdk-first adapter", () => {
  it("fails closed without live submit gates", async () => {
    const result = await submitViaSdkFirstAdapter(undefined);

    expect(result.status).toBe("blocked");
  });
});
