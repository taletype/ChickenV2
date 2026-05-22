import { afterEach, describe, expect, it, vi } from "vitest";
import { buildMarketDetailViewModel } from "@/features/prediction/market-detail/adapter";
import { clearMarketCache } from "@/lib/polymarket/market-cache";

describe("market detail adapter", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    clearMarketCache();
  });

  it("returns unavailable when slug is not found", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => Response.json([])));

    const vm = await buildMarketDetailViewModel({ locale: "en", slug: "missing" });

    expect(vm.status).toBe("unavailable");
    expect(vm.market).toBeNull();
  });
});
