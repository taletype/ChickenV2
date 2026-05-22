import { describe, expect, it, vi } from "vitest";
import {
  buildLocalizedPolymarketFeedPath,
  getLocalizedPolymarketFeedPath,
  getPredictionMobileNavItems
} from "@/features/prediction/routes";

const redirectMock = vi.hoisted(() => vi.fn());

vi.mock("next/navigation", () => ({
  redirect: redirectMock
}));

describe("prediction routes", () => {
  it("builds localized mobile nav paths", () => {
    expect(getPredictionMobileNavItems("en").map((item) => item.href)).toEqual([
      "/en/polymarket",
      "/en/polymarket?sort=recent",
      "/en/portfolio"
    ]);
    expect(getPredictionMobileNavItems("zh").map((item) => item.href)).toEqual([
      "/zh/polymarket",
      "/zh/polymarket?sort=recent",
      "/zh/portfolio"
    ]);
  });

  it("preserves feed query state in localized paths", () => {
    expect(
      buildLocalizedPolymarketFeedPath("en", {
        category: "crypto",
        search: " bitcoin ",
        sort: "liquidity"
      })
    ).toBe("/en/polymarket?category=crypto&search=bitcoin&sort=liquidity");
  });

  it("redirects localized roots to localized Polymarket feeds", async () => {
    const { default: LocaleHomePage } = await import("@/app/[locale]/page");

    await LocaleHomePage({ params: Promise.resolve({ locale: "en" }) });
    await LocaleHomePage({ params: Promise.resolve({ locale: "zh" }) });

    expect(redirectMock).toHaveBeenNthCalledWith(
      1,
      getLocalizedPolymarketFeedPath("en")
    );
    expect(redirectMock).toHaveBeenNthCalledWith(
      2,
      getLocalizedPolymarketFeedPath("zh")
    );
  });
});
