"use client";

import { Bookmark, ImageOff, Share2 } from "lucide-react";
import { useEffect, useState } from "react";
import type { PredictionMarketCardViewModel } from "@/features/prediction/types";

function formatPercent(value: number | null) {
  return value === null ? "N/A" : `${Math.round(value * 100)}%`;
}

function useScrollPastThreshold(threshold: number) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    function handleScroll() {
      setScrolled(window.scrollY > threshold);
    }

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [threshold]);

  return scrolled;
}

export function MarketHeader({ market }: { market: PredictionMarketCardViewModel }) {
  const scrolled = useScrollPastThreshold(20);

  return (
    <header
      className={
        scrolled
          ? "sticky top-[4.5rem] z-30 -mx-4 flex translate-y-1 items-center gap-3 border-b border-[var(--border)] bg-[var(--background)] px-4 py-3 pr-6 transition-all ease-in-out lg:top-[5rem]"
          : "relative z-10 -mx-4 flex items-center gap-3 px-4 transition-all ease-in-out"
      }
    >
      <div className="relative z-10 flex flex-1 items-center gap-2 lg:gap-4">
        <div
          className={
            scrolled
              ? "grid size-10 shrink-0 place-items-center overflow-hidden rounded-sm bg-[var(--muted)] text-[var(--muted-foreground)] transition-all ease-in-out"
              : "grid size-10 shrink-0 place-items-center overflow-hidden rounded-sm bg-[var(--muted)] text-[var(--muted-foreground)] transition-all ease-in-out lg:size-16"
          }
        >
          {market.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={market.image} alt="" className="h-full w-full object-cover" />
          ) : (
            <ImageOff className="size-5 lg:size-7" aria-hidden="true" />
          )}
        </div>

        <div className="flex min-w-0 flex-1 flex-col items-start transition-all ease-in-out">
          <div
            className={
              scrolled
                ? "pointer-events-none flex max-h-0 max-w-full min-w-0 -translate-y-1 items-center gap-1 overflow-hidden text-xs font-medium text-[var(--muted-foreground)] opacity-0 transition-all ease-in-out"
                : "flex max-h-6 max-w-full min-w-0 translate-y-0 items-center gap-1 overflow-hidden text-xs font-medium text-[var(--muted-foreground)] opacity-100 transition-all ease-in-out lg:text-sm"
            }
            aria-hidden={scrolled}
          >
            <span className="truncate">{market.category ?? "General"}</span>
            {market.bestOutcome ? (
              <>
                <span className="shrink-0" aria-hidden="true">
                  ·
                </span>
                <span className="truncate">
                  {market.bestOutcome.label} {formatPercent(market.bestOutcome.price)}
                </span>
              </>
            ) : null}
          </div>
          <h1
            className={
              scrolled
                ? "min-w-0 text-sm font-semibold leading-tight text-pretty text-[var(--foreground)] transition-all ease-in-out lg:text-base"
                : "min-w-0 text-xl font-semibold leading-tight text-pretty text-[var(--foreground)] transition-all ease-in-out lg:text-2xl"
            }
          >
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
