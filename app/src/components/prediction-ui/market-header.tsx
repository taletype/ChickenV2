import { Bookmark, ImageOff, Share2 } from "lucide-react";
import type { PredictionMarketCardViewModel } from "@/features/prediction/types";

function formatPercent(value: number | null) {
  return value === null ? "N/A" : `${Math.round(value * 100)}%`;
}

export function MarketHeader({ market }: { market: PredictionMarketCardViewModel }) {
  return (
    <header className="relative z-10 -mx-4 flex items-center gap-3 px-4">
      <div className="relative z-10 flex flex-1 items-center gap-2 lg:gap-4">
        <div className="grid size-10 shrink-0 place-items-center overflow-hidden rounded-sm bg-[var(--muted)] text-[var(--muted-foreground)] lg:size-16">
          {market.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={market.image} alt="" className="h-full w-full object-cover" />
          ) : (
            <ImageOff className="size-5 lg:size-7" aria-hidden="true" />
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex max-w-full min-w-0 items-center gap-1 overflow-hidden text-xs font-medium text-[var(--muted-foreground)] lg:text-sm">
            <span className="truncate">{market.category ?? "General"}</span>
            {market.bestOutcome ? (
              <>
                <span className="shrink-0" aria-hidden="true">
                  /
                </span>
                <span className="truncate">
                  {market.bestOutcome.label} {formatPercent(market.bestOutcome.price)}
                </span>
              </>
            ) : null}
          </div>
          <h1 className="min-w-0 text-xl font-semibold leading-tight text-pretty text-[var(--foreground)] lg:text-2xl">
            {market.question}
          </h1>
        </div>
      </div>

      <div className="flex items-center gap-2 text-[var(--foreground)]">
        <button
          type="button"
          className="focus-ring inline-flex size-9 items-center justify-center rounded-sm text-[var(--muted-foreground)] transition-colors hover:bg-[var(--accent)] hover:text-[var(--foreground)]"
          aria-label="Share market"
        >
          <Share2 className="size-4" aria-hidden="true" />
        </button>
        <button
          type="button"
          className="focus-ring inline-flex size-9 items-center justify-center rounded-sm text-[var(--muted-foreground)] transition-colors hover:bg-[var(--accent)] hover:text-[var(--foreground)]"
          aria-label="Bookmark market"
        >
          <Bookmark className="size-4" aria-hidden="true" />
        </button>
      </div>
    </header>
  );
}
