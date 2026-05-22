import { Search } from "lucide-react";
import { FeedToolbar } from "@/components/prediction-ui/feed-toolbar";
import { MarketGrid } from "@/components/prediction-ui/market-grid";
import { StatusBanner } from "@/components/prediction-ui/status-banner";
import { buildMarketFeedViewModel } from "@/features/prediction/market-feed/adapter";
import {
  normalizePredictionFeedSort,
  normalizePredictionSearchSlug
} from "@/features/prediction/routes";

function isZh(locale: string) {
  return locale.toLowerCase().startsWith("zh");
}

export async function PredictionResultsPage({
  locale,
  slug,
  sort,
  status
}: {
  locale: string;
  slug: string;
  sort?: string | null;
  status?: string | null;
}) {
  const search = normalizePredictionSearchSlug(slug);
  const selectedSort = normalizePredictionFeedSort(sort);
  const feed = await buildMarketFeedViewModel({
    locale,
    search,
    sort: selectedSort,
    limit: 48
  });
  const labels = isZh(locale)
    ? {
        eyebrow: "搜尋結果",
        title: search ? `「${search}」` : "市場搜尋",
        description: "只顯示 V2 Polymarket adapter 返回的真實市場。",
        unsupportedStatus: "此結果頁尚未支援狀態篩選；目前顯示同一組真實搜尋結果。"
      }
    : {
        eyebrow: "Search results",
        title: search ? `"${search}"` : "Market search",
        description: "Only real markets returned by the V2 Polymarket adapter are shown.",
        unsupportedStatus: "Status filters are not wired in V2 yet; this page shows the same real search results."
      };

  return (
    <div>
      <section className="app-container grid gap-4 pb-2 pt-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-sm font-semibold text-[var(--muted-foreground)]">
              <Search className="size-4" aria-hidden="true" />
              <span>{labels.eyebrow}</span>
            </div>
            <h1 className="mt-2 truncate text-3xl font-bold tracking-tight text-[var(--foreground)]">
              {labels.title}
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--muted-foreground)]">
              {labels.description}
            </p>
          </div>
        </div>
        {status && status !== "all" ? (
          <StatusBanner status="empty">{labels.unsupportedStatus}</StatusBanner>
        ) : null}
      </section>

      <FeedToolbar
        locale={locale}
        selectedCategory={feed.selectedCategory}
        selectedSearch={feed.selectedSearch}
        selectedSort={feed.selectedSort}
      />
      <section className="app-container pb-6">
        {feed.freshness.stale ? (
          <div className="mb-4">
            <StatusBanner status="stale">
              Market data was fetched but is marked stale.
            </StatusBanner>
          </div>
        ) : null}
        <MarketGrid markets={feed.markets} status={feed.status} error={feed.error} />
      </section>
    </div>
  );
}
