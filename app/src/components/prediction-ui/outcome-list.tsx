import type { PredictionMarketCardViewModel } from "@/features/prediction/types";

function formatPercent(value: number | null) {
  return value === null ? "N/A" : `${Math.round(value * 100)}%`;
}

export function OutcomeList({ market }: { market: PredictionMarketCardViewModel }) {
  return (
    <section className="overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--card)] transition-all duration-500 ease-in-out">
      <div className="flex h-[4.5rem] items-center justify-between gap-4 p-4">
        <div className="min-w-0">
          <h2 className="text-base font-medium text-[var(--foreground)]">Outcomes</h2>
          <p className="truncate text-xs font-medium text-[var(--muted-foreground)]">
            CLOB token availability from the market adapter
          </p>
        </div>
        <div className="text-sm font-medium text-[var(--muted-foreground)]">
          {market.outcomes.length} listed
        </div>
      </div>
      <div className="grid gap-2 border-t border-[var(--border)] p-3 sm:grid-cols-2">
        {market.outcomes.map((outcome, index) => (
          <div
            key={`${outcome.label}-${outcome.tokenId ?? "missing"}`}
            className="flex min-h-[4.5rem] items-center justify-between gap-4 rounded-lg border border-[var(--border)] p-3 transition-colors hover:bg-[var(--muted)]"
          >
            <div className="flex min-w-0 items-center gap-3">
              <span
                className={
                  index === 1
                    ? "inline-flex size-2.5 shrink-0 rounded-full bg-[var(--no)]"
                    : "inline-flex size-2.5 shrink-0 rounded-full bg-[var(--yes)]"
                }
                aria-hidden="true"
              />
              <div className="min-w-0">
                <div className="truncate text-sm font-semibold text-[var(--foreground)]">
                  {outcome.label}
                </div>
                <div className="text-xs font-medium text-[var(--muted-foreground)]">
                  {outcome.tokenId ? "Token available" : "Token unavailable"}
                </div>
              </div>
            </div>
            <div className="shrink-0 rounded-md bg-[var(--muted)] px-2.5 py-1 text-sm font-bold tabular-nums text-[var(--foreground)]">
              {formatPercent(outcome.price)}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
