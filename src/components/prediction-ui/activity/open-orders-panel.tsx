import { ListOrdered } from "lucide-react";
import type { ReactNode } from "react";
import type { PredictionOpenOrdersViewModel } from "@/features/prediction/types";

function isZh(locale?: string) {
  return locale?.toLowerCase().startsWith("zh") ?? false;
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
  return new Intl.NumberFormat("en", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2
  }).format(value);
}

function stateCopy(openOrders: PredictionOpenOrdersViewModel, locale?: string) {
  if (openOrders.status === "unavailable") {
    return {
      title: isZh(locale) ? "掛單暫不可用" : "Open orders unavailable",
      description: isZh(locale)
        ? "V2 尚未接入可驗證的 open-orders adapter。"
        : "V2 has no verified open-orders adapter wired here."
    };
  }

  return {
    title: isZh(locale) ? "沒有掛單" : "No open orders returned",
    description: isZh(locale)
      ? "只有在 V2 open-orders adapter 返回空列表時，才會顯示此狀態。"
      : "This state appears only when the V2 open-orders adapter returns an empty list."
  };
}

export function OpenOrdersPanel({
  openOrders,
  locale
}: {
  openOrders: PredictionOpenOrdersViewModel;
  locale?: string;
}) {
  const hasOrders = openOrders.status === "ready" && openOrders.orders.length > 0;
  const copy = stateCopy(openOrders, locale);

  return (
    <section
      className="relative w-full overflow-x-auto rounded-lg border border-[var(--border)] bg-[var(--card)]"
      data-testid="prediction-open-orders-panel"
    >
      <table className="w-full min-w-[860px] table-fixed border-collapse">
        <thead>
          <tr className="border-b border-[var(--border)]">
            <TableHeader className="w-[30%] text-left">
              {isZh(locale) ? "市場" : "Market"}
            </TableHeader>
            <TableHeader className="w-[12%] text-center">
              {isZh(locale) ? "方向" : "Side"}
            </TableHeader>
            <TableHeader className="w-[16%] text-left">
              {isZh(locale) ? "結果" : "Outcome"}
            </TableHeader>
            <TableHeader className="w-[10%] text-right">
              {isZh(locale) ? "價格" : "Price"}
            </TableHeader>
            <TableHeader className="w-[10%] text-right">
              {isZh(locale) ? "數量" : "Size"}
            </TableHeader>
            <TableHeader className="w-[10%] text-right">
              {isZh(locale) ? "已成交" : "Filled"}
            </TableHeader>
            <TableHeader className="w-[12%] text-right">
              {isZh(locale) ? "狀態" : "Status"}
            </TableHeader>
          </tr>
        </thead>
        {hasOrders ? (
          <tbody className="divide-y divide-[var(--border)]">
            {openOrders.orders.map((order) => (
              <tr key={order.id} className="transition-colors hover:bg-[var(--muted)]">
                <td className="max-w-0 px-3 py-3 text-sm font-semibold text-[var(--foreground)]">
                  <span className="truncate">{order.market ?? "--"}</span>
                </td>
                <td className="px-3 py-3 text-center text-sm font-semibold uppercase">
                  {order.side ?? "--"}
                </td>
                <td className="px-3 py-3 text-sm font-semibold text-[var(--muted-foreground)]">
                  {order.outcome ?? "--"}
                </td>
                <td className="px-3 py-3 text-right text-sm font-semibold tabular-nums">
                  {formatPrice(order.price)}
                </td>
                <td className="px-3 py-3 text-right text-sm font-semibold tabular-nums">
                  {formatNumber(order.size)}
                </td>
                <td className="px-3 py-3 text-right text-sm font-semibold tabular-nums">
                  {formatNumber(order.filledSize)}
                </td>
                <td className="px-3 py-3 text-right text-xs font-medium text-[var(--muted-foreground)]">
                  {order.status ?? "--"}
                </td>
              </tr>
            ))}
          </tbody>
        ) : null}
      </table>

      {!hasOrders ? (
        <PanelState
          icon={<ListOrdered className="size-5" aria-hidden="true" />}
          title={copy.title}
          description={copy.description}
        />
      ) : null}
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

function PanelState({
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
