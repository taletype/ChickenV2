import { MarketGridSkeleton } from "@/components/prediction-ui/market-grid";

export default function PolymarketLoading() {
  return (
    <div>
      <div className="sticky top-[60px] z-20 border-b border-[var(--border)] bg-[var(--background)] md:top-[68px]">
        <div className="app-container h-12" />
      </div>
      <div className="app-container grid gap-4 py-4">
        <div className="flex justify-end">
          <div className="h-9 w-full rounded-md bg-[var(--muted)] md:w-52 xl:w-60" />
        </div>
      </div>
      <section className="app-container pb-6">
        <MarketGridSkeleton />
      </section>
    </div>
  );
}
