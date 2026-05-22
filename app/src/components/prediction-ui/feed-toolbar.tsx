import { Bookmark, Check, Search, Settings2, TrendingUp, X } from "lucide-react";
import { PREDICTION_CATEGORIES } from "@/lib/polymarket/categories";
import {
  buildLocalizedPolymarketFeedPath,
  getLocalizedPolymarketFeedPath,
  PREDICTION_FEED_SORTS,
  type PredictionFeedSort
} from "@/features/prediction/routes";

const CATEGORY_LABELS = {
  en: {
    trending: "Trending",
    politics: "Politics",
    sports: "Sports",
    crypto: "Crypto",
    culture: "Culture",
    business: "Business"
  },
  zh: {
    trending: "熱門",
    politics: "政治",
    sports: "體育",
    crypto: "加密貨幣",
    culture: "文化",
    business: "商業"
  }
} as const;

const SORT_LABELS: Record<"en" | "zh", Record<PredictionFeedSort, string>> = {
  en: {
    volume: "Volume",
    liquidity: "Liquidity",
    recent: "Recent"
  },
  zh: {
    volume: "成交量",
    liquidity: "流動性",
    recent: "最新"
  }
};

function localeKey(locale: string): "en" | "zh" {
  return locale.toLowerCase().startsWith("zh") ? "zh" : "en";
}

function categoryLabel(locale: string, category: string) {
  const key = localeKey(locale);
  return CATEGORY_LABELS[key][category as keyof (typeof CATEGORY_LABELS)[typeof key]]
    ?? category;
}

function searchLabel(locale: string) {
  return localeKey(locale) === "zh" ? "搜尋市場" : "Search markets";
}

export function FeedToolbar({
  locale,
  selectedCategory,
  selectedSearch,
  selectedSort
}: {
  locale: string;
  selectedCategory: string;
  selectedSearch: string;
  selectedSort: PredictionFeedSort;
}) {
  const labels = SORT_LABELS[localeKey(locale)];
  const basePath = getLocalizedPolymarketFeedPath(locale);

  return (
    <>
      <nav className="sticky top-[60px] z-20 bg-[var(--background)] md:top-[68px]">
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-[var(--border)]" />
        <div className="app-container flex w-full min-w-0">
          <div className="flex h-12 w-full min-w-0 snap-x snap-mandatory scroll-px-3 items-center overflow-x-auto text-sm font-medium">
            {PREDICTION_CATEGORIES.map((category, index) => {
              const isActive = category === selectedCategory;
              const href = buildLocalizedPolymarketFeedPath(locale, {
                category,
                search: selectedSearch,
                sort: selectedSort
              });

              return (
                <div key={category} className="flex snap-start items-center">
                  <a
                    href={href}
                    aria-current={isActive ? "page" : undefined}
                    className={
                      isActive
                        ? "focus-ring inline-flex h-full items-center justify-center gap-2 rounded-md py-1 pl-0 pr-2.5 font-semibold whitespace-nowrap text-[var(--foreground)]"
                        : "focus-ring inline-flex h-full items-center justify-center rounded-md px-3 py-1 whitespace-nowrap text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                    }
                  >
                    {category === "trending" ? (
                      <TrendingUp className="size-4" aria-hidden="true" />
                    ) : null}
                    <span>{categoryLabel(locale, category)}</span>
                  </a>
                  {index === 1 ? (
                    <div className="mx-3 h-5 w-px shrink-0 bg-[var(--border)]" />
                  ) : null}
                </div>
              );
            })}
          </div>
        </div>
      </nav>

      <div className="app-container grid gap-4 py-4">
        <div className="flex w-full min-w-0 flex-col gap-3">
          <div className="flex w-full min-w-0 flex-col gap-3 md:flex-row md:items-center md:gap-4">
            <div className="order-1 flex w-full min-w-0 items-center gap-3 md:order-3 md:ml-auto md:w-auto">
              <form
                action={basePath}
                className="min-w-0 flex-1"
                role="search"
              >
                {selectedCategory !== "trending" ? (
                  <input type="hidden" name="category" value={selectedCategory} />
                ) : null}
                {selectedSort !== "volume" ? (
                  <input type="hidden" name="sort" value={selectedSort} />
                ) : null}
                <div className="relative w-full md:w-52 xl:w-60">
                  <Search
                    className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[var(--muted-foreground)]"
                    aria-hidden="true"
                  />
                  <input
                    type="search"
                    name="search"
                    defaultValue={selectedSearch}
                    placeholder={localeKey(locale) === "zh" ? "搜尋" : "Search"}
                    aria-label={searchLabel(locale)}
                    className="h-9 w-full min-w-0 rounded-md border border-transparent bg-[var(--accent)] py-1 pl-10 pr-16 text-base shadow-none outline-none transition-colors placeholder:text-[var(--muted-foreground)] hover:bg-[var(--muted)] focus:border-[var(--border)] focus:bg-[var(--background)] md:text-sm"
                  />
                  {selectedSearch ? (
                    <a
                      href={buildLocalizedPolymarketFeedPath(locale, {
                        category: selectedCategory,
                        sort: selectedSort
                      })}
                      aria-label={localeKey(locale) === "zh" ? "清除搜尋" : "Clear search"}
                      className="focus-ring absolute right-9 top-1/2 inline-flex size-6 -translate-y-1/2 items-center justify-center rounded-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                    >
                      <X className="size-4" aria-hidden="true" />
                    </a>
                  ) : null}
                  <button
                    type="submit"
                    aria-label={searchLabel(locale)}
                    className="focus-ring absolute right-2 top-1/2 inline-flex size-6 -translate-y-1/2 items-center justify-center rounded-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                  >
                    <Search className="size-4" aria-hidden="true" />
                  </button>
                </div>
              </form>

              <div className="flex items-center gap-2 md:gap-3">
                <details className="group relative">
                  <summary
                    aria-label={localeKey(locale) === "zh" ? "開啟篩選" : "Open filters"}
                    className="focus-ring inline-flex size-9 cursor-pointer list-none items-center justify-center rounded-sm text-sm font-medium transition-colors hover:bg-[var(--accent)] group-open:bg-[var(--accent)] [&::-webkit-details-marker]:hidden"
                  >
                    <Settings2 className="size-6 md:size-5" aria-hidden="true" />
                  </summary>
                  <div className="absolute right-0 top-11 z-30 w-44 overflow-hidden rounded-md border border-[var(--border)] bg-[var(--card)] py-1 text-sm shadow-[var(--panel-shadow)]">
                    {PREDICTION_FEED_SORTS.map((sort) => (
                      <a
                        key={sort}
                        href={buildLocalizedPolymarketFeedPath(locale, {
                          category: selectedCategory,
                          search: selectedSearch,
                          sort
                        })}
                        className="focus-ring flex items-center justify-between gap-3 px-3 py-2 font-medium text-[var(--foreground)] hover:bg-[var(--accent)]"
                      >
                        <span>{labels[sort]}</span>
                        {sort === selectedSort ? (
                          <Check className="size-4 text-[var(--primary)]" aria-hidden="true" />
                        ) : null}
                      </a>
                    ))}
                  </div>
                </details>

                <button
                  type="button"
                  className="inline-flex size-9 shrink-0 cursor-not-allowed items-center justify-center rounded-sm text-sm font-medium text-[var(--muted-foreground)] opacity-50"
                  aria-label={localeKey(locale) === "zh" ? "書籤篩選尚未啟用" : "Bookmark filter unavailable"}
                  disabled
                >
                  <Bookmark className="size-6 md:size-5" aria-hidden="true" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
