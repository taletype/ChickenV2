import type { SupportedLocale } from "@/i18n/locales";
import {
  normalizePredictionCategory,
  PREDICTION_CATEGORIES,
  type PredictionCategory
} from "@/lib/polymarket/categories";

export const PREDICTION_FEED_SORTS = ["volume", "liquidity", "recent"] as const;

export type PredictionFeedSort = (typeof PREDICTION_FEED_SORTS)[number];

export type PredictionFeedPathOptions = {
  category?: string | null;
  search?: string | null;
  sort?: string | null;
};

export type PredictionDiscoveryTarget =
  | {
      kind: "feed";
      category?: PredictionCategory;
      search?: string;
      sort?: PredictionFeedSort;
    }
  | {
      kind: "profile";
      slug: string;
    };

const ROOT_PROFILE_PREFIX = "@";

export function normalizePredictionSearchSlug(value: string | null | undefined) {
  return decodeURIComponent(value ?? "")
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

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

export function buildLocalizedProfilePath(
  locale: SupportedLocale | string,
  slug: string
) {
  const normalizedSlug = slug.trim().replace(/^@+/, "");
  return `/${locale}/profile/${encodeURIComponent(normalizedSlug)}`;
}

export function buildLocalizedPredictionResultsPath(
  locale: SupportedLocale | string,
  slug: string,
  options: Pick<PredictionFeedPathOptions, "sort"> = {}
) {
  const normalizedSlug = slug.trim();
  const sort = normalizePredictionFeedSort(options.sort);
  const suffix = sort === "volume" ? "" : `?sort=${encodeURIComponent(sort)}`;
  return `/${locale}/predictions/${encodeURIComponent(normalizedSlug)}${suffix}`;
}

export function resolvePredictionRootSlugTarget(
  slug: string
): PredictionDiscoveryTarget {
  const normalizedSlug = slug.trim().toLowerCase();

  if (normalizedSlug === "new") {
    return {
      kind: "feed",
      sort: "recent"
    };
  }

  if (normalizedSlug.startsWith(ROOT_PROFILE_PREFIX)) {
    return {
      kind: "profile",
      slug: normalizedSlug.slice(ROOT_PROFILE_PREFIX.length)
    };
  }

  const category = normalizePredictionCategory(normalizedSlug);
  if (
    category !== "trending" ||
    PREDICTION_CATEGORIES.includes(normalizedSlug as PredictionCategory)
  ) {
    return {
      kind: "feed",
      category
    };
  }

  return {
    kind: "feed",
    search: normalizePredictionSearchSlug(slug)
  };
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
