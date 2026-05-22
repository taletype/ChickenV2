"use client";

import { Check, Circle, ExternalLink, Info, ShieldCheck } from "lucide-react";
import { useState } from "react";
import type {
  PredictionMarketCardViewModel,
  PredictionMarketDetailViewModel
} from "@/features/prediction/types";

type DetailMetadata = NonNullable<PredictionMarketDetailViewModel["metadata"]>;
type DetailTab = "rules" | "metadata" | "resolution";

function isZh(locale?: string) {
  return locale?.toLowerCase().startsWith("zh") ?? false;
}

function formatDate(value: string | null, locale?: string) {
  if (!value) {
    return "Not returned";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "Not returned";
  }

  return new Intl.DateTimeFormat(locale ?? "en-US", {
    month: "short",
    day: "numeric",
    year: "numeric"
  }).format(date);
}

function formatMoney(value: number | null, locale?: string) {
  if (value === null || !Number.isFinite(value)) {
    return "Not returned";
  }

  return new Intl.NumberFormat(locale ?? "en-US", {
    style: "currency",
    currency: "USD",
    notation: Math.abs(value) >= 10_000 ? "compact" : "standard",
    maximumFractionDigits: Math.abs(value) >= 10_000 ? 1 : 2
  }).format(value);
}

function formatNumber(value: number | null, locale?: string) {
  if (value === null || !Number.isFinite(value)) {
    return "Not returned";
  }

  return new Intl.NumberFormat(locale ?? "en-US", {
    maximumFractionDigits: 4
  }).format(value);
}

function formatTokenAvailability(market: PredictionMarketCardViewModel) {
  const available = market.outcomes.filter((outcome) => Boolean(outcome.tokenId)).length;
  return `${available} of ${market.outcomes.length} available`;
}

function resolveTabs(locale?: string): Array<{ id: DetailTab; label: string }> {
  if (isZh(locale)) {
    return [
      { id: "rules", label: "規則" },
      { id: "metadata", label: "市場資料" },
      { id: "resolution", label: "結算" }
    ];
  }

  return [
    { id: "rules", label: "Rules" },
    { id: "metadata", label: "Market details" },
    { id: "resolution", label: "Resolution" }
  ];
}

function MetadataItem({
  label,
  value,
  mono = false
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="rounded-lg border border-[var(--border)] p-3">
      <div className="text-xs font-medium text-[var(--muted-foreground)]">{label}</div>
      <div
        className={
          mono
            ? "mt-1 truncate font-mono text-xs font-semibold text-[var(--foreground)]"
            : "mt-1 text-sm font-semibold text-[var(--foreground)]"
        }
        title={value}
      >
        {value}
      </div>
    </div>
  );
}

function TimelineStep({
  state,
  label,
  detail
}: {
  state: "done" | "open" | "muted";
  label: string;
  detail: string;
}) {
  const Icon = state === "done" ? Check : state === "open" ? Circle : Info;
  const iconClassName =
    state === "done"
      ? "bg-[var(--primary)] text-white"
      : state === "open"
        ? "border-2 border-[var(--primary)] bg-[var(--card)] text-[var(--primary)]"
        : "bg-[var(--muted)] text-[var(--muted-foreground)]";

  return (
    <div className="relative flex items-start gap-3">
      <span
        className={`relative z-10 inline-flex size-6 shrink-0 items-center justify-center rounded-full ${iconClassName}`}
      >
        <Icon className="size-3.5" aria-hidden="true" />
      </span>
      <div className="min-w-0">
        <div className="text-sm font-semibold text-[var(--foreground)]">{label}</div>
        <div className="mt-0.5 text-xs leading-5 text-[var(--muted-foreground)]">{detail}</div>
      </div>
    </div>
  );
}

function RulesPanel({
  description,
  locale
}: {
  description: string | null;
  locale?: string;
}) {
  return (
    <section className="grid gap-3" data-testid="market-rules-panel">
      <div className="flex items-center gap-2">
        <ShieldCheck className="size-4 text-[var(--primary)]" aria-hidden="true" />
        <h2 className="text-base font-medium text-[var(--foreground)]">
          {isZh(locale) ? "規則" : "Rules"}
        </h2>
      </div>
      {description ? (
        <p className="whitespace-pre-line text-sm leading-6 text-[var(--foreground)]">
          {description}
        </p>
      ) : (
        <p className="text-sm leading-6 text-[var(--muted-foreground)]">
          {isZh(locale)
            ? "市場資料未返回規則內容。"
            : "The market adapter did not return rules text for this market."}
        </p>
      )}
    </section>
  );
}

function MetadataPanel({
  market,
  metadata,
  locale
}: {
  market: PredictionMarketCardViewModel;
  metadata: DetailMetadata;
  locale?: string;
}) {
  const statusLabel = market.tradable
    ? isZh(locale)
      ? "來源市場可交易"
      : "Tradable in source market"
    : isZh(locale)
      ? "來源市場暫不可交易"
      : "Not tradable in source market";

  return (
    <section className="grid gap-3" data-testid="market-metadata-panel">
      <div className="grid gap-3 sm:grid-cols-2">
        <MetadataItem label={isZh(locale) ? "狀態" : "Status"} value={statusLabel} />
        <MetadataItem
          label={isZh(locale) ? "CLOB token" : "CLOB tokens"}
          value={formatTokenAvailability(market)}
        />
        <MetadataItem
          label={isZh(locale) ? "24 小時成交量" : "24h volume"}
          value={formatMoney(metadata.volume24hr, locale)}
        />
        <MetadataItem
          label={isZh(locale) ? "流動性" : "Liquidity"}
          value={formatMoney(metadata.liquidity, locale)}
        />
        <MetadataItem
          label={isZh(locale) ? "最小訂單" : "Minimum order"}
          value={formatNumber(metadata.minimumOrderSize, locale)}
        />
        <MetadataItem
          label={isZh(locale) ? "Tick size" : "Tick size"}
          value={formatNumber(metadata.tickSize, locale)}
        />
        <MetadataItem
          label={isZh(locale) ? "更新時間" : "Updated"}
          value={formatDate(metadata.updatedAt, locale)}
        />
        <MetadataItem
          label={isZh(locale) ? "結束日期" : "End date"}
          value={formatDate(metadata.endDate, locale)}
        />
      </div>
      <MetadataItem
        label={isZh(locale) ? "Condition ID" : "Condition ID"}
        value={metadata.conditionId ?? "Not returned"}
        mono
      />
    </section>
  );
}

function ResolutionPanel({
  market,
  metadata,
  locale
}: {
  market: PredictionMarketCardViewModel;
  metadata: DetailMetadata;
  locale?: string;
}) {
  const sourceLabel = metadata.resolutionSource ?? "Not returned";
  const sourceUrl = metadata.resolutionSourceUrl;
  const endDateLabel = formatDate(metadata.endDate, locale);

  return (
    <section className="grid gap-4" data-testid="market-resolution-panel">
      <div className="relative grid gap-6">
        <span
          className="absolute bottom-3 left-2.5 top-3 w-px bg-[var(--border)]"
          aria-hidden="true"
        />
        <TimelineStep
          state="done"
          label={isZh(locale) ? "來源市場已載入" : "Source market loaded"}
          detail={
            isZh(locale)
              ? "此頁只顯示 V2 adapter 返回的市場資料。"
              : "This page renders only market data returned by the V2 adapter."
          }
        />
        <TimelineStep
          state={market.tradable ? "open" : "muted"}
          label={isZh(locale) ? "交易狀態" : "Trading status"}
          detail={
            market.tradable
              ? isZh(locale)
                ? "來源市場目前標記為可交易。"
                : "The source market is currently marked tradable."
              : isZh(locale)
                ? "來源市場目前未標記為可交易。"
                : "The source market is not currently marked tradable."
          }
        />
        <TimelineStep
          state="muted"
          label={isZh(locale) ? "結束日期" : "End date"}
          detail={endDateLabel}
        />
      </div>

      <div className="rounded-lg border border-[var(--border)] p-3">
        <div className="text-xs font-medium text-[var(--muted-foreground)]">
          {isZh(locale) ? "Resolution Source" : "Resolution source"}
        </div>
        {sourceUrl ? (
          <a
            href={sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-1 inline-flex max-w-full items-center gap-1 text-xs font-semibold text-[var(--primary)] hover:opacity-80"
          >
            <span className="truncate">{sourceLabel}</span>
            <ExternalLink className="size-3.5 shrink-0" aria-hidden="true" />
          </a>
        ) : (
          <div className="mt-1 text-sm font-semibold text-[var(--foreground)]">
            {sourceLabel}
          </div>
        )}
      </div>
    </section>
  );
}

export function MarketDetailTabs({
  market,
  description,
  metadata,
  locale
}: {
  market: PredictionMarketCardViewModel;
  description: string | null;
  metadata: DetailMetadata | null;
  locale?: string;
}) {
  const tabs = resolveTabs(locale);
  const [selectedTab, setSelectedTab] = useState<DetailTab>("rules");

  if (!metadata) {
    return (
      <section className="rounded-xl border border-[var(--border)] p-4">
        <RulesPanel description={description} locale={locale} />
      </section>
    );
  }

  return (
    <section className="pt-0" data-testid="market-detail-tabs">
      <div className="flex items-center gap-2 border-b border-[var(--border)]">
        <div className="flex w-0 flex-1 gap-4 overflow-x-auto">
          {tabs.map((tab) => {
            const isActive = selectedTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                className={
                  isActive
                    ? "focus-ring border-b-2 border-[var(--primary)] pb-2 pt-1 text-sm font-semibold whitespace-nowrap text-[var(--foreground)] transition-colors"
                    : "focus-ring border-b-2 border-transparent pb-2 pt-1 text-sm font-semibold whitespace-nowrap text-[var(--muted-foreground)] transition-colors hover:text-[var(--foreground)]"
                }
                onClick={() => setSelectedTab(tab.id)}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="py-4">
        {selectedTab === "rules" ? (
          <RulesPanel description={description} locale={locale} />
        ) : null}
        {selectedTab === "metadata" ? (
          <MetadataPanel market={market} metadata={metadata} locale={locale} />
        ) : null}
        {selectedTab === "resolution" ? (
          <ResolutionPanel market={market} metadata={metadata} locale={locale} />
        ) : null}
      </div>
    </section>
  );
}
