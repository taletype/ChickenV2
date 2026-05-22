"use client";

import { Activity, ReceiptText, WalletCards } from "lucide-react";
import { useState, type ReactNode } from "react";
import type { PredictionPortfolioViewModel } from "@/features/prediction/types";
import { FundingPanel } from "../funding/funding-panel";
import { StatusBanner } from "../status-banner";

type FundingPanelViewModel = Awaited<ReturnType<
  typeof import("@/features/prediction/funding/adapter").buildFundingPanelViewModel
>>;

type PortfolioTab = "positions" | "fills";

function formatCompactNumber(value: number) {
  return new Intl.NumberFormat("en", {
    notation: "compact",
    maximumFractionDigits: 1
  }).format(value);
}

function formatCurrency(value: number | null) {
  if (value === null || !Number.isFinite(value)) {
    return "--";
  }

  return new Intl.NumberFormat("en", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value);
}

function formatNumber(value: number) {
  return new Intl.NumberFormat("en", {
    maximumFractionDigits: 4
  }).format(value);
}

function formatPrice(value: number) {
  if (value >= 0 && value <= 1) {
    return `${(value * 100).toLocaleString("en", {
      maximumFractionDigits: 1
    })}c`;
  }

  return formatCurrency(value);
}

function formatTimestamp(value: string | null) {
  if (!value) {
    return "--";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString("en", {
    month: "short",
    day: "numeric",
    year: "numeric"
  });
}

function getOutcomeTone(outcome: string) {
  return outcome.toLowerCase().includes("no") ? "no" : "yes";
}

export function PortfolioView({
  portfolio,
  funding,
  locale
}: {
  portfolio: PredictionPortfolioViewModel;
  funding: FundingPanelViewModel;
  locale?: string;
}) {
  const [activeTab, setActiveTab] = useState<PortfolioTab>("positions");
  const totalCurrentValue =
    portfolio.pnl.status === "available" ? portfolio.pnl.totalCurrentValue : null;
  const addressLabel = portfolio.addressLabel ?? "No wallet connected";

  return (
    <main className="app-container-sm py-8">
      <div className="mx-auto grid gap-6">
        <section className="grid gap-4 md:grid-cols-2">
          <div className="relative min-h-[220px] overflow-hidden rounded-lg border border-[var(--border)] bg-[var(--card)] p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex min-w-0 flex-col gap-1">
                <span className="text-sm font-semibold tracking-wide text-[var(--muted-foreground)]">
                  Portfolio
                </span>
                <div className="text-3xl font-bold leading-tight text-[var(--foreground)] sm:text-4xl">
                  {portfolio.status === "ready"
                    ? formatCurrency(totalCurrentValue)
                    : "Connect wallet"}
                </div>
                <div className="text-sm font-semibold text-[var(--muted-foreground)]">
                  {portfolio.status === "ready"
                    ? `Connected as ${addressLabel}`
                    : "Real account data appears after wallet connection."}
                </div>
              </div>
              <div className="grid size-11 shrink-0 place-items-center rounded-md bg-[var(--foreground)] text-white">
                <WalletCards className="size-5" aria-hidden="true" />
              </div>
            </div>

            <div className="mt-auto grid grid-cols-3 gap-2.5 pt-8">
              <SummaryStat label="Positions" value={formatCompactNumber(portfolio.positions.length)} />
              <SummaryStat label="Fills" value={formatCompactNumber(portfolio.fills.length)} />
              <SummaryStat
                label="Value"
                value={portfolio.pnl.status === "available" ? formatCurrency(totalCurrentValue) : "--"}
              />
            </div>
          </div>

          <div className="relative min-h-[220px] overflow-hidden rounded-lg border border-[var(--border)] bg-[var(--card)] p-4">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Activity className="size-4 text-[var(--primary)]" aria-hidden="true" />
                <h2 className="text-base font-semibold text-[var(--foreground)]">
                  Account Status
                </h2>
              </div>
              <div className="select-none text-xl font-semibold text-slate-300">
                Chicken Dinner
              </div>
            </div>

            <div className="mt-6 space-y-4">
              <StatusLine label="Wallet" value={addressLabel} />
              <StatusLine
                label="Position value"
                value={
                  portfolio.pnl.status === "available"
                    ? formatCurrency(totalCurrentValue)
                    : "Unavailable from returned positions"
                }
              />
              <StatusLine
                label="Data source"
                value={portfolio.status === "ready" ? "Polymarket account API" : portfolio.status}
              />
            </div>
          </div>
        </section>

        {portfolio.status === "disconnected" ? (
          <StatusBanner status="empty">
            No wallet session is active, so balances and positions are not displayed.
          </StatusBanner>
        ) : null}
        {portfolio.status === "unavailable" ? (
          <StatusBanner status="unavailable">
            Portfolio data is unavailable
            {portfolio.error ? `: ${portfolio.error}` : "."}
          </StatusBanner>
        ) : null}

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_21.25rem]">
          <section className="overflow-hidden rounded-lg border border-[var(--border)] bg-[var(--card)]">
            <div className="relative">
              <div className="flex items-center gap-6 px-4 pt-4 sm:px-6">
                <PortfolioTabButton
                  active={activeTab === "positions"}
                  onClick={() => setActiveTab("positions")}
                >
                  Positions
                </PortfolioTabButton>
                <PortfolioTabButton
                  active={activeTab === "fills"}
                  onClick={() => setActiveTab("fills")}
                >
                  Fills
                </PortfolioTabButton>
              </div>
              <div className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-[var(--border)]" />
            </div>

            {activeTab === "positions" ? (
              <PositionsTable portfolio={portfolio} />
            ) : (
              <FillsTable portfolio={portfolio} />
            )}
          </section>

          <aside className="lg:sticky lg:top-[9.5rem] lg:self-start">
            <FundingPanel funding={funding} locale={locale} />
          </aside>
        </div>
      </div>
    </main>
  );
}

function SummaryStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex min-h-16 flex-col rounded-lg bg-[var(--muted)] p-2 shadow-sm">
      <p className="text-sm font-medium text-[var(--muted-foreground)]">{label}</p>
      <p className="mt-auto truncate text-lg font-semibold tracking-tight text-[var(--foreground)]">
        {value}
      </p>
    </div>
  );
}

function StatusLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-[var(--border)] pb-3 last:border-0">
      <span className="text-sm font-medium text-[var(--muted-foreground)]">{label}</span>
      <span className="min-w-0 truncate text-right text-sm font-semibold text-[var(--foreground)]">
        {value}
      </span>
    </div>
  );
}

function PortfolioTabButton({
  active,
  children,
  onClick
}: {
  active: boolean;
  children: ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        active
          ? "focus-ring relative border-b-2 border-[var(--primary)] pb-3 text-sm font-semibold text-[var(--foreground)] transition-colors"
          : "focus-ring relative border-b-2 border-transparent pb-3 text-sm font-semibold text-[var(--muted-foreground)] transition-colors hover:text-[var(--foreground)]"
      }
    >
      {children}
    </button>
  );
}

function PositionsTable({ portfolio }: { portfolio: PredictionPortfolioViewModel }) {
  const hasPositions = portfolio.positions.length > 0;

  return (
    <div className="relative w-full overflow-x-auto">
      <table className="w-full min-w-[640px] table-fixed border-collapse">
        <thead>
          <tr className="border-b border-[var(--border)]">
            <TableHeader className="w-[46%] text-left">Market</TableHeader>
            <TableHeader className="w-[18%] text-left">Outcome</TableHeader>
            <TableHeader className="w-[18%] text-right">Shares</TableHeader>
            <TableHeader className="w-[18%] text-right">Value</TableHeader>
          </tr>
        </thead>
        {hasPositions ? (
          <tbody className="divide-y divide-[var(--border)]">
            {portfolio.positions.map((position) => {
              const tone = getOutcomeTone(position.outcome);
              return (
                <tr
                  key={`${position.market}-${position.outcome}`}
                  className="transition-colors hover:bg-[var(--muted)]"
                >
                  <td className="max-w-0 px-3 py-3 align-middle">
                    <div className="flex min-w-0 items-start gap-3">
                      <div className="grid size-12 shrink-0 place-items-center rounded-sm bg-[var(--muted)] text-[var(--muted-foreground)]">
                        <ReceiptText className="size-4" aria-hidden="true" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-[13px] font-semibold leading-tight text-[var(--foreground)]">
                          {position.market}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-3 text-left align-middle">
                    <OutcomeBadge label={position.outcome} tone={tone} />
                  </td>
                  <td className="px-3 py-3 text-right text-sm font-semibold tabular-nums text-[var(--muted-foreground)]">
                    {formatNumber(position.size)}
                  </td>
                  <td className="px-3 py-3 text-right text-sm font-semibold tabular-nums text-[var(--foreground)]">
                    {formatCurrency(position.currentValue)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        ) : null}
      </table>
      {!hasPositions ? (
        <div className="py-12 text-center text-sm text-[var(--muted-foreground)]">
          No real positions returned for this wallet.
        </div>
      ) : null}
    </div>
  );
}

function FillsTable({ portfolio }: { portfolio: PredictionPortfolioViewModel }) {
  const hasFills = portfolio.fills.length > 0;

  return (
    <div className="relative w-full overflow-x-auto">
      <table className="w-full min-w-[920px] table-fixed border-collapse">
        <thead>
          <tr className="border-b border-[var(--border)]">
            <TableHeader className="w-[38%] text-left">Market</TableHeader>
            <TableHeader className="w-[12%] text-center">Side</TableHeader>
            <TableHeader className="w-[16%] text-left">Outcome</TableHeader>
            <TableHeader className="w-[12%] text-right">Price</TableHeader>
            <TableHeader className="w-[12%] text-right">Size</TableHeader>
            <TableHeader className="w-[10%] text-right">Time</TableHeader>
          </tr>
        </thead>
        {hasFills ? (
          <tbody className="divide-y divide-[var(--border)]">
            {portfolio.fills.map((fill) => (
              <tr
                key={`${fill.market}-${fill.outcome}-${fill.timestamp ?? fill.price}`}
                className="transition-colors hover:bg-[var(--muted)]"
              >
                <td className="max-w-0 px-3 py-3 align-middle">
                  <div className="truncate text-sm font-semibold text-[var(--foreground)]">
                    {fill.market}
                  </div>
                </td>
                <td className="px-3 py-3 text-center text-sm font-semibold">
                  {fill.side}
                </td>
                <td className="px-3 py-3 text-left align-middle">
                  <OutcomeBadge label={fill.outcome} tone={getOutcomeTone(fill.outcome)} />
                </td>
                <td className="px-3 py-3 text-right text-sm font-semibold tabular-nums">
                  {formatPrice(fill.price)}
                </td>
                <td className="px-3 py-3 text-right text-sm font-semibold tabular-nums">
                  {formatNumber(fill.size)}
                </td>
                <td className="px-3 py-3 text-right text-xs font-medium text-[var(--muted-foreground)]">
                  {formatTimestamp(fill.timestamp)}
                </td>
              </tr>
            ))}
          </tbody>
        ) : null}
      </table>
      {!hasFills ? (
        <div className="py-12 text-center text-sm text-[var(--muted-foreground)]">
          No real fills returned for this wallet.
        </div>
      ) : null}
    </div>
  );
}

function TableHeader({
  children,
  className = ""
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <th
      className={`px-3 py-3 text-xs font-semibold uppercase tracking-wide text-[var(--muted-foreground)] ${className}`}
    >
      {children}
    </th>
  );
}

function OutcomeBadge({ label, tone }: { label: string; tone: "yes" | "no" }) {
  return (
    <span
      className={
        tone === "yes"
          ? "inline-flex max-w-full items-center rounded-sm bg-[var(--yes-soft)] px-2 py-0.5 text-sm font-semibold text-[var(--yes)]"
          : "inline-flex max-w-full items-center rounded-sm bg-[var(--no-soft)] px-2 py-0.5 text-sm font-semibold text-[var(--no)]"
      }
    >
      <span className="truncate">{label}</span>
    </span>
  );
}
