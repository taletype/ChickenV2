import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  buildLocalizedPolymarketFeedPath,
  buildLocalizedPredictionResultsPath,
  buildLocalizedProfilePath,
  getLocalizedPolymarketFeedPath,
  getPredictionMobileNavItems,
  normalizePredictionSearchSlug,
  resolvePredictionRootSlugTarget
} from "@/features/prediction/routes";

const redirectMock = vi.hoisted(() => vi.fn());
const notFoundMock = vi.hoisted(() => vi.fn());

vi.mock("next/navigation", () => ({
  redirect: redirectMock,
  notFound: notFoundMock
}));

describe("prediction routes", () => {
  beforeEach(() => {
    redirectMock.mockClear();
    notFoundMock.mockClear();
  });

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

  it("normalizes discovery slugs without inventing user or market records", () => {
    expect(normalizePredictionSearchSlug("bitcoin-price")).toBe("bitcoin price");
    expect(resolvePredictionRootSlugTarget("crypto")).toEqual({
      kind: "feed",
      category: "crypto"
    });
    expect(resolvePredictionRootSlugTarget("new")).toEqual({
      kind: "feed",
      sort: "recent"
    });
    expect(resolvePredictionRootSlugTarget("@alice")).toEqual({
      kind: "profile",
      slug: "alice"
    });
    expect(resolvePredictionRootSlugTarget("fed rates")).toEqual({
      kind: "feed",
      search: "fed rates"
    });
    expect(buildLocalizedProfilePath("en", "@alice")).toBe("/en/profile/alice");
    expect(buildLocalizedPredictionResultsPath("zh", "fed-rates", { sort: "recent" })).toBe(
      "/zh/predictions/fed-rates?sort=recent"
    );
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

  it("redirects discovery aliases to V2 market feed or profile shells", async () => {
    const { default: NewMarketsPage } = await import("@/app/[locale]/new/page");
    const { default: RootSlugPage } = await import("@/app/[locale]/[slug]/page");
    const { default: RootSubcategoryPage } = await import("@/app/[locale]/[slug]/[subcategory]/page");

    await NewMarketsPage({ params: Promise.resolve({ locale: "en" }) });
    await RootSlugPage({ params: Promise.resolve({ locale: "en", slug: "crypto" }) });
    await RootSlugPage({ params: Promise.resolve({ locale: "en", slug: "@alice" }) });
    await RootSubcategoryPage({
      params: Promise.resolve({
        locale: "en",
        slug: "politics",
        subcategory: "election"
      })
    });

    expect(redirectMock).toHaveBeenNthCalledWith(1, "/en/polymarket?sort=recent");
    expect(redirectMock).toHaveBeenNthCalledWith(2, "/en/polymarket?category=crypto");
    expect(redirectMock).toHaveBeenNthCalledWith(3, "/en/profile/alice");
    expect(redirectMock).toHaveBeenNthCalledWith(
      4,
      "/en/polymarket?category=politics&search=election"
    );
  });
});
