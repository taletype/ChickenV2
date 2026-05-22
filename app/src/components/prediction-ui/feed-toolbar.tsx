import { Bookmark, Search, Settings2, TrendingUp } from "lucide-react";
import { PREDICTION_CATEGORIES } from "@/lib/polymarket/categories";

const CATEGORY_LABELS: Record<string, string> = {
  trending: "Trending",
  politics: "Politics",
  sports: "Sports",
  crypto: "Crypto",
  culture: "Culture",
  business: "Business"
};

export function FeedToolbar({
  selectedCategory
}: {
  selectedCategory: string;
}) {
  return (
    <>
      <nav className="sticky top-[60px] z-20 bg-[var(--background)] md:top-[68px]">
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-[var(--border)]" />
        <div className="app-container flex w-full min-w-0">
          <div className="flex h-12 w-full min-w-0 snap-x snap-mandatory scroll-px-3 items-center overflow-x-auto text-sm font-medium">
            {PREDICTION_CATEGORIES.map((category, index) => (
              <div key={category} className="flex snap-start items-center">
                <a
                  href={`?category=${category}`}
                  className={
                    category === selectedCategory
                      ? "focus-ring inline-flex h-full items-center justify-center gap-2 rounded-md border-transparent py-1 pl-0 pr-2.5 font-semibold whitespace-nowrap text-[var(--foreground)]"
                      : "focus-ring inline-flex h-full items-center justify-center rounded-md border-transparent px-3 py-1 whitespace-nowrap text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                  }
                >
                  {category === "trending" ? (
                    <TrendingUp className="size-4" aria-hidden="true" />
                  ) : null}
                  <span>{CATEGORY_LABELS[category] ?? category}</span>
                </a>
                {index === 1 ? (
                  <div className="mx-3 h-5 w-px shrink-0 bg-[var(--border)]" />
                ) : null}
              </div>
            ))}
          </div>
        </div>
      </nav>

      <div className="app-container grid gap-4 py-4">
        <div className="flex w-full min-w-0 flex-col gap-3">
          <div className="flex w-full min-w-0 flex-col gap-3 md:flex-row md:items-center md:gap-4">
            <div className="order-1 flex w-full min-w-0 items-center gap-3 md:order-3 md:ml-auto md:w-auto">
              <div className="min-w-0 flex-1">
                <div className="relative w-full md:w-44 lg:w-52 xl:w-56">
                  <Search
                    className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[var(--muted-foreground)]"
                    aria-hidden="true"
                  />
                  <input
                    type="text"
                    placeholder="Search"
                    aria-label="Search markets"
                    className="h-9 w-full min-w-0 rounded-md border border-transparent bg-[var(--accent)] py-1 pl-10 pr-3 text-base shadow-none outline-none transition-colors placeholder:text-[var(--muted-foreground)] hover:bg-[var(--muted)] focus:border-[var(--border)] focus:bg-[var(--background)] md:text-sm"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 md:gap-3">
                <button
                  type="button"
                  className="focus-ring inline-flex size-9 shrink-0 items-center justify-center rounded-sm text-sm font-medium transition-colors hover:bg-[var(--accent)]"
                  aria-label="Open filters"
                >
                  <Settings2 className="size-6 md:size-5" aria-hidden="true" />
                </button>
                <button
                  type="button"
                  className="focus-ring inline-flex size-9 shrink-0 items-center justify-center rounded-sm text-sm font-medium transition-colors hover:bg-[var(--accent)]"
                  aria-label="Filter by bookmarks"
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
