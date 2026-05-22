import { Activity, ExternalLink, SlidersHorizontal } from "lucide-react";
import type { ReactNode } from "react";
import type { PredictionActivityViewModel } from "@/features/prediction/types";

function isZh(locale?: string) {
  return locale?.toLowerCase().startsWith("zh") ?? false;
}

function formatCurrency(value: number | null) {
  if (value === null || !Number.isFinite(value)) {
    return "--";
  }

  return new Intl.NumberFormat("en", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2
  }).format(value);
}

function formatNumber(value: number | null) {
  if (value === null || !Number.isFinite(value)) {
    return "--";
  }

  return new Intl.NumberFormat("en", {
    maximumFractionDigits: 4
  }).format(value);
}

function formatPrice(value: number | null) {
  if (value === null || !Number.isFinite(value)) {
    return "--";
  }
  if (value >= 0 && value <= 1) {
    return `${(value * 100).toLocaleString("en", {
      maximumFractionDigits: 1
    })}c`;
  }
  return formatCurrency(value);
}

function formatTimestamp(value: string | null, locale?: string) {
  if (!value) {
    return "--";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString(locale ?? "en", {
    month: "short",
    day: "numeric",
    year: "numeric"
  });
}

function stateCopy(activity: PredictionActivityViewModel, locale?: string) {
  if (activity.status === "unavailable") {
    const title =
      activity.scope === "account"
        ? isZh(locale)
          ? "賬戶活動暫不可用"
          : "Account activity unavailable"
        : isZh(locale)
          ? "市場活動暫不可用"
          : "Market activity unavailable";

    return {
      title,
      description: isZh(locale)
        ? "V2 尚未接入可驗證的活動 adapter。"
        : "V2 has no verified activity adapter wired here."
    };
  }

  return {
    title: isZh(locale) ? "沒有活動" : "No activity returned",
    description: isZh(locale)
      ? "只有在 V2 活動 adapter 返回空列表時，才會顯示此狀態。"
      : "This state appears only when the V2 activity adapter returns an empty list."
  };
}

export function ActivityPanel({
  activity,
  locale
}: {
  activity: PredictionActivityViewModel;
  locale?: string;
}) {
  const hasRecords = activity.status === "ready" && activity.records.length > 0;
  const copy = stateCopy(activity, locale);

  return (
    <section className="grid gap-3" data-testid="prediction-activity-panel">
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          disabled
          className="inline-flex h-9 cursor-not-allowed items-center gap-1.5 rounded-md border border-[var(--border)] bg-[var(--card)] px-3 text-sm font-semibold text-[var(--muted-foreground)]"
        >
          <SlidersHorizontal className="size-4" aria-hidden="true" />
          {isZh(locale) ? "全部市場" : "All markets"}
        </button>
        <button
          type="button"
          disabled
          className="inline-flex h-9 cursor-not-allowed items-center rounded-md border border-[var(--border)] bg-[var(--card)] px-3 text-sm font-semibold text-[var(--muted-foreground)]"
        >
          {isZh(locale) ? "最低金額" : "Min amount"}
        </button>
      </div>

      <div className="relative w-full overflow-x-auto rounded-lg border border-[var(--border)] bg-[var(--card)]">
        <table className="w-full min-w-[880px] table-fixed border-collapse">
          <thead>
            <tr className="border-b border-[var(--border)]">
              <TableHeader className="w-[18%] text-left">
                {isZh(locale) ? "用戶" : "Actor"}
              </TableHeader>
              <TableHeader className="w-[30%] text-left">
                {isZh(locale) ? "市場" : "Market"}
              </TableHeader>
              <TableHeader className="w-[10%] text-center">
                {isZh(locale) ? "方向" : "Side"}
              </TableHeader>
              <TableHeader className="w-[14%] text-left">
                {isZh(locale) ? "結果" : "Outcome"}
              </TableHeader>
              <TableHeader className="w-[10%] text-right">
                {isZh(locale) ? "價格" : "Price"}
              </TableHeader>
              <TableHeader className="w-[10%] text-right">
                {isZh(locale) ? "數量" : "Size"}
              </TableHeader>
              <TableHeader className="w-[8%] text-right">
                {isZh(locale) ? "時間" : "Time"}
              </TableHeader>
            </tr>
          </thead>
          {hasRecords ? (
            <tbody className="divide-y divide-[var(--border)]">
              {activity.records.map((record) => (
                <tr key={record.id} className="transition-colors hover:bg-[var(--muted)]">
                  <td className="px-3 py-3 text-sm font-semibold text-[var(--foreground)]">
                    {record.actorLabel ?? (isZh(locale) ? "用戶不可用" : "Actor unavailable")}
                  </td>
                  <td className="max-w-0 px-3 py-3 text-sm font-semibold text-[var(--foreground)]">
                    <span className="truncate">{record.market ?? "--"}</span>
                  </td>
                  <td className="px-3 py-3 text-center text-sm font-semibold uppercase">
                    {record.side ?? "--"}
                  </td>
                  <td className="px-3 py-3 text-sm font-semibold text-[var(--muted-foreground)]">
                    {record.outcome ?? "--"}
                  </td>
                  <td className="px-3 py-3 text-right text-sm font-semibold tabular-nums">
                    {formatPrice(record.price)}
                  </td>
                  <td className="px-3 py-3 text-right text-sm font-semibold tabular-nums">
                    {formatNumber(record.size)}
                  </td>
                  <td className="px-3 py-3 text-right text-xs font-medium text-[var(--muted-foreground)]">
                    <span className="inline-flex items-center justify-end gap-1">
                      {formatTimestamp(record.timestamp, locale)}
                      {record.transactionUrl ? (
                        <a
                          href={record.transactionUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          aria-label={isZh(locale) ? "查看交易" : "View transaction"}
                          className="text-[var(--primary)]"
                        >
                          <ExternalLink className="size-3.5" aria-hidden="true" />
                        </a>
                      ) : null}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          ) : null}
        </table>

        {!hasRecords ? (
          <ShellState
            icon={<Activity className="size-5" aria-hidden="true" />}
            title={copy.title}
            description={copy.description}
          />
        ) : null}
      </div>
    </section>
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

function ShellState({
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
