import type { PredictionMarketCardViewModel } from "@/features/prediction/types";
import { MarketCard } from "./market-card";

export function MarketGrid({
  markets,
  status,
  error
}: {
  markets: PredictionMarketCardViewModel[];
  status: "ready" | "empty" | "unavailable";
  error: string | null;
}) {
  if (status === "unavailable") {
    return (
      <MarketGridState
        title="Market data is unavailable"
        body={error ?? "The Polymarket adapter returned an unavailable state."}
      />
    );
  }

  if (status === "empty") {
    return (
      <MarketGridState
        title="No markets match this view"
        body="Try another category, search, or sort using the toolbar above."
      />
    );
  }

  return (
    <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {markets.map((market) => (
        <MarketCard key={market.id} market={market} />
      ))}
    </div>
  );
}

export function MarketGridSkeleton({ count = 12 }: { count?: number }) {
  return (
    <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {Array.from({ length: count }, (_, index) => (
        <div
          key={`market-card-skeleton-${index}`}
          className="h-[180px] animate-pulse rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 shadow-md shadow-black/[0.04]"
        >
          <div className="mb-3 flex items-start gap-2">
            <div className="size-10 rounded-sm bg-[var(--muted)]" />
            <div className="flex-1 space-y-2">
              <div className="h-3 w-3/4 rounded-sm bg-[var(--muted)]" />
              <div className="h-3 w-1/2 rounded-sm bg-[var(--muted)]" />
            </div>
            <div className="h-12 w-14 rounded-sm bg-[var(--muted)]" />
          </div>
          <div className="mt-6 mb-3 grid grid-cols-2 gap-2">
            <div className="h-10 rounded-sm bg-[var(--muted)]" />
            <div className="h-10 rounded-sm bg-[var(--muted)]" />
          </div>
          <div className="flex items-center justify-between">
            <div className="h-3 w-16 rounded-sm bg-[var(--muted)]" />
            <div className="h-3 w-6 rounded-sm bg-[var(--muted)]" />
          </div>
        </div>
      ))}
    </div>
  );
}

function MarketGridState({
  title,
  body
}: {
  title: string;
  body: string;
}) {
  return (
    <div className="flex min-h-50 min-w-0 items-center justify-center rounded-xl border border-dashed border-[var(--border)] bg-[var(--card)] px-4 py-8 text-center">
      <div>
        <h2 className="text-sm font-semibold text-[var(--foreground)]">{title}</h2>
        <p className="mt-2 max-w-md text-sm leading-6 text-[var(--muted-foreground)]">
          {body}
        </p>
      </div>
    </div>
  );
}
