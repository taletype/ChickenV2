import { Bookmark, ImageOff } from "lucide-react";
import type { PredictionMarketCardViewModel } from "@/features/prediction/types";

function formatVolume(value: number | null) {
  if (value === null) {
    return "N/A";
  }

  return new Intl.NumberFormat("en", {
    notation: "compact",
    maximumFractionDigits: 1
  }).format(value);
}

export function MarketCard({ market }: { market: PredictionMarketCardViewModel }) {
  const primaryChance = Math.round((market.outcomes[0]?.price ?? 0) * 100);
  const chanceColor =
    primaryChance < 40
      ? "var(--no)"
      : primaryChance === 50
        ? "#94a3b8"
        : "var(--yes)";
  const firstOutcome = market.outcomes[0] ?? null;
  const secondOutcome = market.outcomes[1] ?? null;
  const strokeLength = 94.25;
  const strokeDash = (primaryChance / 100) * strokeLength;

  return (
    <article className="group flex h-[180px] flex-col overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--surface)] text-[var(--foreground)] shadow-md shadow-black/[0.04] transition-all hover:-translate-y-0.5 hover:shadow-black/[0.08]">
      <a href={market.href} className="focus-ring flex h-full flex-col">
        <div className="flex h-full flex-col px-3 pb-3 pt-3 md:pb-1">
          <div className="mb-3 flex items-start justify-between">
            <div className="flex flex-1 items-center gap-2 pr-2">
              <div className="grid size-10 shrink-0 place-items-center self-start overflow-hidden rounded-sm bg-[var(--accent)] text-[var(--muted-foreground)]">
                {market.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={market.image}
                    alt=""
                    className="h-full w-full object-cover object-center"
                    loading="eager"
                  />
                ) : (
                  <ImageOff className="size-4" aria-hidden="true" />
                )}
              </div>

              <h2 className="line-clamp-3 w-full text-sm/5 font-semibold underline-offset-2 transition-colors duration-200 group-hover:text-[var(--foreground)] group-hover:underline">
                {market.question}
              </h2>
            </div>

            <div className="relative -mt-3 flex flex-col items-center">
              <div className="relative">
                <svg
                  width="72"
                  height="52"
                  viewBox="0 0 72 52"
                  className="rotate-0 transform"
                  aria-hidden="true"
                >
                  <path
                    d="M 6 46 A 30 30 0 0 1 66 46"
                    fill="none"
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeWidth="5"
                    className="text-slate-200"
                  />
                  <path
                    d="M 6 46 A 30 30 0 0 1 66 46"
                    fill="none"
                    stroke="currentColor"
                    strokeDasharray={`${strokeDash} ${strokeLength}`}
                    strokeDashoffset="0"
                    strokeLinecap="round"
                    strokeWidth="5"
                    className="transition-all duration-300"
                    style={{ color: chanceColor }}
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center pt-4">
                  <span className="text-sm font-bold text-slate-900">
                    {primaryChance}%
                  </span>
                </div>
              </div>
              <div className="-mt-2 text-xs font-medium text-[var(--muted-foreground)]">
                chance
              </div>
            </div>
          </div>

          <div className="flex flex-1 flex-col">
            <div className="mt-auto mb-2 grid grid-cols-2 gap-2">
              <OutcomeButton tone="yes" label={firstOutcome?.label ?? "Yes"} />
              <OutcomeButton tone="no" label={secondOutcome?.label ?? "No"} />
            </div>
          </div>

          <div className="flex items-center justify-between gap-2 text-xs text-[var(--muted-foreground)]">
            <div className="flex items-center gap-2">
              <span>
                {formatVolume(market.volume24hr)}
                {" "}
                Vol.
              </span>
            </div>
            <span
              aria-hidden="true"
              className="-mr-1 inline-flex size-7 items-center justify-center rounded-sm text-[var(--muted-foreground)] transition-colors group-hover:bg-[var(--accent)] group-hover:text-[var(--foreground)]"
            >
              <Bookmark className="size-4" aria-hidden="true" />
            </span>
          </div>
        </div>
      </a>
    </article>
  );
}

function OutcomeButton({
  label,
  tone
}: {
  label: string;
  tone: "yes" | "no";
}) {
  return (
    <span
      className={
        tone === "yes"
          ? "inline-flex h-10 min-w-0 flex-1 items-center justify-center gap-1 rounded-sm bg-[var(--yes-soft)] px-3 text-sm font-semibold text-[var(--yes)] transition-colors group-hover:bg-[var(--yes)] group-hover:text-white"
          : "inline-flex h-10 min-w-0 flex-1 items-center justify-center gap-1 rounded-sm bg-[var(--no-soft)] px-3 text-sm font-semibold text-[var(--no)] transition-colors group-hover:bg-[var(--no)] group-hover:text-white"
      }
    >
      <span className="truncate">{label}</span>
    </span>
  );
}
