import { Activity } from "lucide-react";
import type { ReactNode } from "react";
import type { PredictionPortfolioViewModel } from "@/features/prediction/types";

type FillRecord = PredictionPortfolioViewModel["fills"][number];

function isZh(locale?: string) {
  return locale?.toLowerCase().startsWith("zh") ?? false;
}

function formatNumber(value: number) {
  return new Intl.NumberFormat("en", {
    maximumFractionDigits: 4
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

export function FillsPanel({
  fills,
  emptyTitle,
  emptyDescription,
  locale
}: {
  fills: FillRecord[];
  emptyTitle: string;
  emptyDescription: string;
  locale?: string;
}) {
  const hasFills = fills.length > 0;

  return (
    <div
      className="relative w-full overflow-x-auto"
      data-testid="prediction-fills-panel"
    >
      <table className="w-full min-w-[920px] table-fixed border-collapse">
        <thead>
          <tr className="border-b border-[var(--border)]">
            <TableHeader className="w-[38%] text-left">
              {isZh(locale) ? "市場" : "Market"}
            </TableHeader>
            <TableHeader className="w-[12%] text-center">
              {isZh(locale) ? "方向" : "Side"}
            </TableHeader>
            <TableHeader className="w-[16%] text-left">
              {isZh(locale) ? "結果" : "Outcome"}
            </TableHeader>
            <TableHeader className="w-[12%] text-right">
              {isZh(locale) ? "價格" : "Price"}
            </TableHeader>
            <TableHeader className="w-[12%] text-right">
              {isZh(locale) ? "數量" : "Size"}
            </TableHeader>
            <TableHeader className="w-[10%] text-right">
              {isZh(locale) ? "時間" : "Time"}
            </TableHeader>
          </tr>
        </thead>
        {hasFills ? (
          <tbody className="divide-y divide-[var(--border)]">
            {fills.map((fill) => (
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
        <FillsState
          icon={<Activity className="size-5" aria-hidden="true" />}
          title={emptyTitle}
          description={emptyDescription}
        />
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

function FillsState({
  icon,
  title,
  description
}: {
  icon: ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="grid min-h-[220px] place-items-center px-4 py-12 text-center">
      <div className="max-w-md space-y-3">
        <div className="mx-auto grid size-11 place-items-center rounded-full bg-[var(--muted)] text-[var(--muted-foreground)]">
          {icon}
        </div>
        <div>
          <p className="text-sm font-bold text-[var(--foreground)]">{title}</p>
          <p className="mt-1 text-sm leading-6 text-[var(--muted-foreground)]">{description}</p>
        </div>
      </div>
    </div>
  );
}
