import type { PredictionMarketCardViewModel } from "@/features/prediction/types";

function formatPercent(value: number | null) {
  return value === null ? "N/A" : `${Math.round(value * 100)}%`;
}

export function OutcomeList({ market }: { market: PredictionMarketCardViewModel }) {
  return (
    <section className="overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--card)]">
      <div className="flex h-[72px] items-center justify-between gap-4 px-4">
        <div>
          <h2 className="text-base font-medium">Outcomes</h2>
          <p className="text-xs font-medium text-[var(--muted-foreground)]">
            Real CLOB token availability only
          </p>
        </div>
        <div className="text-sm font-medium text-[var(--muted-foreground)]">
          {market.outcomes.length} listed
        </div>
      </div>
      <div className="divide-y divide-[var(--border)]">
        {market.outcomes.map((outcome, index) => (
          <div
            key={`${outcome.label}-${outcome.tokenId ?? "missing"}`}
            className="flex items-center justify-between gap-4 px-4 py-3 transition-colors hover:bg-[var(--muted)]"
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
                  {outcome.tokenId ? "CLOB token available" : "Token unavailable"}
                </div>
              </div>
            </div>
            <div className="shrink-0 rounded-md bg-[var(--muted)] px-2.5 py-1 text-sm font-bold tabular-nums">
              {formatPercent(outcome.price)}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
