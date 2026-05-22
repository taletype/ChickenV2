import { FeedToolbar } from "@/components/prediction-ui/feed-toolbar";
import { MarketGrid } from "@/components/prediction-ui/market-grid";
import { StatusBanner } from "@/components/prediction-ui/status-banner";
import { buildMarketFeedViewModel } from "@/features/prediction/market-feed/adapter";

export default async function PolymarketPage({
  params,
  searchParams
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ category?: string }>;
}) {
  const [{ locale }, query] = await Promise.all([params, searchParams]);
  const feed = await buildMarketFeedViewModel({
    locale,
    category: query.category
  });

  return (
    <div>
      <FeedToolbar selectedCategory={feed.selectedCategory} />
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
