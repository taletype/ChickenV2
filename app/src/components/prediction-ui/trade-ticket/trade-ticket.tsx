"use client";

import { ChevronDown, LockKeyhole, ShieldCheck } from "lucide-react";
import { useMemo, useState } from "react";
import type { PredictionTradeTicketViewModel } from "@/features/prediction/types";

type Outcome = {
  label: string;
  price: number | null;
  tokenId: string | null;
};

export function TradeTicket({
  ticket,
  outcomes
}: {
  ticket: PredictionTradeTicketViewModel;
  outcomes: Outcome[];
}) {
  const [side, setSide] = useState<"BUY" | "SELL">(ticket.side);
  const [selectedTokenId, setSelectedTokenId] = useState(ticket.selectedTokenId);
  const selected = useMemo(
    () =>
      outcomes.find((outcome) => outcome.tokenId === selectedTokenId) ??
      outcomes.find((outcome) => outcome.tokenId) ??
      null,
    [outcomes, selectedTokenId]
  );
  const unavailable = ticket.status !== "ready" || !selected?.tokenId;

  return (
    <section className="w-full rounded-xl border border-[var(--border)] bg-[var(--card)] p-4 shadow-[var(--panel-shadow)] lg:w-[21.25rem]">
      <div className="mb-4 flex items-center justify-between gap-4">
        <div className="flex items-center gap-4 text-sm font-semibold">
          {(["BUY", "SELL"] as const).map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => setSide(option)}
              className={
                side === option
                  ? "focus-ring border-b-[3px] border-[var(--foreground)] pb-2 text-base font-semibold text-[var(--foreground)] transition-colors"
                  : "focus-ring border-b-[3px] border-transparent pb-2 text-base font-semibold text-[var(--muted-foreground)] transition-colors hover:text-[var(--foreground)]"
              }
            >
              {option === "BUY" ? "Buy" : "Sell"}
            </button>
          ))}
        </div>

        <button
          type="button"
          className="focus-ring inline-flex items-center gap-1 pb-2 text-sm font-semibold text-[var(--foreground)]"
          aria-label="Order type"
        >
          Market
          <ChevronDown className="size-4 text-[var(--muted-foreground)]" aria-hidden="true" />
        </button>
      </div>

      <div className="mb-3 flex items-center justify-between gap-3 rounded-md bg-[var(--muted)] px-3 py-2">
        <div className="text-xs font-semibold text-[var(--muted-foreground)]">
          Trading status
        </div>
        <div className="flex items-center gap-1 text-xs font-semibold text-[var(--foreground)]">
          <ShieldCheck className="size-4" aria-hidden="true" />
          Fail-closed
        </div>
      </div>

      <div className="mb-2 flex gap-2">
        {outcomes.map((outcome, index) => (
          <button
            key={`${outcome.label}-${outcome.tokenId ?? "missing"}`}
            type="button"
            disabled={!outcome.tokenId}
            onClick={() => setSelectedTokenId(outcome.tokenId)}
            className={
              selected?.tokenId === outcome.tokenId
                ? index === 1
                  ? "focus-ring flex h-12 min-w-0 flex-1 items-center justify-center gap-1 rounded-md bg-[var(--no)] px-3 text-sm font-semibold text-white shadow-sm"
                  : "focus-ring flex h-12 min-w-0 flex-1 items-center justify-center gap-1 rounded-md bg-[var(--yes)] px-3 text-sm font-semibold text-white shadow-sm"
                : "focus-ring flex h-12 min-w-0 flex-1 items-center justify-center gap-1 rounded-md border border-[var(--border)] bg-[var(--card)] px-3 text-sm font-semibold text-[var(--foreground)] disabled:cursor-not-allowed disabled:opacity-55"
            }
          >
            <span className="min-w-0 truncate opacity-75">{outcome.label}</span>
            <span className="shrink-0 text-base font-bold">
              {outcome.price === null ? "N/A" : `${Math.round(outcome.price * 100)}%`}
            </span>
          </button>
        ))}
      </div>

      <div className="mb-2 flex items-center gap-3">
        <label className="shrink-0">
          <span className="block text-lg font-medium">Amount</span>
          <span className="block text-xs text-[var(--muted-foreground)]">
            Wallet required
          </span>
        </label>
        <input
          className="h-14 min-w-0 flex-1 border-0 bg-transparent text-right text-3xl font-semibold text-[var(--foreground)] outline-none placeholder:text-slate-400"
          placeholder="$0"
          aria-label="Size"
          inputMode="decimal"
          disabled
        />
      </div>

      <div className="mb-4 grid grid-cols-2 gap-3">
        <label className="space-y-1 text-xs font-semibold text-[var(--muted-foreground)]">
          Market price
          <input
            className="h-11 w-full rounded-md border border-[var(--border)] bg-[var(--input)] px-3 text-sm font-semibold text-[var(--foreground)] outline-none"
            value={selected?.price ?? ""}
            readOnly
            aria-label="Price"
          />
        </label>
        <label className="space-y-1 text-xs font-semibold text-[var(--muted-foreground)]">
          Selected
          <input
            className="h-11 w-full rounded-md border border-[var(--border)] bg-[var(--input)] px-3 text-sm font-semibold text-[var(--foreground)] outline-none"
            value={selected?.label ?? ""}
            readOnly
            aria-label="Selected outcome"
          />
        </label>
      </div>

      <div className="relative w-full pb-1">
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-4 rounded-b-md bg-[color-mix(in_srgb,var(--primary)_80%,black)]" />
        <button
          className="focus-ring relative mt-2 flex h-12 w-full translate-y-0 items-center justify-center gap-2 overflow-hidden rounded-md bg-[var(--primary)] px-4 text-base font-bold text-white transition-transform hover:translate-y-px disabled:cursor-not-allowed disabled:bg-slate-400"
          disabled
          type="button"
        >
          <LockKeyhole className="size-4" aria-hidden="true" />
          Submit blocked
        </button>
      </div>

      <p className="mt-3 text-xs leading-5 text-[var(--muted-foreground)]">
        {unavailable
          ? ticket.disabledReason ?? "Trading is not available for this market."
          : "Live submit remains blocked until wallet, funding, and server gates are ready."}
      </p>
    </section>
  );
}
