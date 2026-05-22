import { ArrowUpRight, Ban, CircleDollarSign } from "lucide-react";

type FundingPanelViewModel = ReturnType<
  typeof import("@/features/prediction/funding/adapter").buildFundingPanelViewModel
>;

export function FundingPanel({ funding }: { funding: FundingPanelViewModel }) {
  const method = funding.methods[0] ?? null;

  return (
    <section className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-4 shadow-[var(--panel-shadow)]">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-base font-medium">Funding</h2>
        <CircleDollarSign className="size-5 text-[var(--primary)]" aria-hidden="true" />
      </div>

      <div className="mt-4 rounded-md bg-[var(--muted)] p-3">
        <div className="text-xs font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">
          Readiness
        </div>
        <div className="mt-1 text-sm font-bold text-[var(--foreground)]">
          {funding.readiness.state}
        </div>
      </div>

      {method ? (
        <a
          href={method.href}
          target="_blank"
          rel="noreferrer"
          className="focus-ring mt-4 flex h-11 items-center justify-center gap-2 rounded-md bg-[var(--primary)] px-4 text-sm font-bold text-white shadow-sm"
        >
          Add funds
          <ArrowUpRight className="size-4" aria-hidden="true" />
        </a>
      ) : null}

      <button
        type="button"
        disabled
        className="mt-3 flex h-11 w-full cursor-not-allowed items-center justify-center gap-2 rounded-md border border-[var(--border)] bg-[var(--card)] px-4 text-sm font-bold text-[var(--muted-foreground)]"
      >
        <Ban className="size-4" aria-hidden="true" />
        Unsupported withdrawal path
      </button>
    </section>
  );
}
