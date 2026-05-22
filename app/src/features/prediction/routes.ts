import type { SupportedLocale } from "@/i18n/locales";

export const PREDICTION_FEED_SORTS = ["volume", "liquidity", "recent"] as const;

export type PredictionFeedSort = (typeof PREDICTION_FEED_SORTS)[number];

export type PredictionFeedPathOptions = {
  category?: string | null;
  search?: string | null;
  sort?: string | null;
};

export function normalizePredictionFeedSort(
  value: string | null | undefined
): PredictionFeedSort {
  const normalized = value?.toLowerCase();

  if (PREDICTION_FEED_SORTS.includes(normalized as PredictionFeedSort)) {
    return normalized as PredictionFeedSort;
  }

  return "volume";
}

export function getLocalizedPolymarketFeedPath(locale: SupportedLocale | string) {
  return `/${locale}/polymarket`;
}

export function buildLocalizedPolymarketFeedPath(
  locale: SupportedLocale | string,
  options: PredictionFeedPathOptions = {}
) {
  const params = new URLSearchParams();
  const category = options.category?.trim();
  const search = options.search?.trim();
  const sort = normalizePredictionFeedSort(options.sort);

  if (category && category !== "trending") {
    params.set("category", category);
  }

  if (search) {
    params.set("search", search);
  }

  if (sort !== "volume") {
    params.set("sort", sort);
  }

  const query = params.toString();
  return `${getLocalizedPolymarketFeedPath(locale)}${query ? `?${query}` : ""}`;
}

export type PredictionMobileNavItem = {
  key: "home" | "recent" | "portfolio";
  href: string;
  label: string;
  matchPath: string;
};

export function getPredictionMobileNavItems(
  locale: SupportedLocale | string
): PredictionMobileNavItem[] {
  const isZh = locale.toLowerCase().startsWith("zh");

  return [
    {
      key: "home",
      href: getLocalizedPolymarketFeedPath(locale),
      label: isZh ? "主頁" : "Home",
      matchPath: "/polymarket"
    },
    {
      key: "recent",
      href: buildLocalizedPolymarketFeedPath(locale, { sort: "recent" }),
      label: isZh ? "最新" : "Recent",
      matchPath: "/polymarket"
    },
    {
      key: "portfolio",
      href: `/${locale}/portfolio`,
      label: isZh ? "投資組合" : "Portfolio",
      matchPath: "/portfolio"
    }
  ];
}
