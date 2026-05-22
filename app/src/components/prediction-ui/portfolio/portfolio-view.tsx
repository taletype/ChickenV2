"use client";

import {
  Activity,
  Ban,
  CheckCircle2,
  ClipboardCheck,
  Copy,
  ListOrdered,
  ReceiptText,
  ShieldCheck,
  TriangleAlert,
  UserRound,
  WalletCards
} from "lucide-react";
import { useState, type ReactNode } from "react";
import type { PredictionPortfolioViewModel } from "@/features/prediction/types";
import { useWalletConnectionState } from "@/hooks/use-wallet-connection-state";
import type { WalletConnectionViewState } from "@/lib/wallet/appkit";
import { SUPPORTED_WALLET_CHAIN_NAME } from "@/lib/wallet/appkit";
import { FundingPanelContent } from "../funding/funding-panel";
import { StatusBanner } from "../status-banner";

type FundingPanelViewModel = Awaited<ReturnType<
  typeof import("@/features/prediction/funding/adapter").buildFundingPanelViewModel
>>;

type PortfolioTab = "positions" | "fills" | "orders";

const portfolioTabs = [
  { id: "positions", label: "Positions" },
  { id: "fills", label: "Fills" },
  { id: "orders", label: "Open orders" }
] satisfies Array<{ id: PortfolioTab; label: string }>;

function isZh(locale?: string) {
  return locale?.toLowerCase().startsWith("zh") ?? false;
}

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

function walletStatusLabel(walletState: WalletConnectionViewState, locale?: string) {
  if (walletState.status === "connected") {
    return isZh(locale)
      ? `已連接 ${walletState.label}`
      : `Connected ${walletState.label}`;
  }
  if (walletState.status === "unsupported_chain") {
    return isZh(locale)
      ? `錯誤網絡：請切換至 ${SUPPORTED_WALLET_CHAIN_NAME}`
      : `Wrong network: switch to ${SUPPORTED_WALLET_CHAIN_NAME}`;
  }
  if (walletState.status === "connecting") {
    return isZh(locale) ? "正在連接錢包" : "Connecting wallet";
  }
  if (walletState.status === "unconfigured") {
    return isZh(locale)
      ? "Wallet Connect 尚未設定"
      : "Wallet Connect is not configured";
  }
  return isZh(locale) ? "未連接錢包" : "No wallet connected";
}

function depositWalletStatusLabel(funding: FundingPanelViewModel, locale?: string) {
  const wallet = funding.liveTopUp.depositWallet;
  if (wallet.status !== "available") {
    return isZh(locale) ? "不可用" : "Unavailable";
  }
  if (wallet.deployedStatus === "deployed") {
    return isZh(locale) ? "已部署" : "Deployed";
  }
  if (wallet.deployedStatus === "not_deployed") {
    return isZh(locale) ? "未部署" : "Not deployed";
  }
  return isZh(locale) ? "未知" : "Unknown";
}

function topUpGateLabel(funding: FundingPanelViewModel, locale?: string) {
  if (funding.liveTopUp.env.status === "ready") {
    return isZh(locale) ? "已通過" : "Ready";
  }
  if (funding.liveTopUp.env.reason === "disabled") {
    return isZh(locale) ? "預設停用" : "Disabled by default";
  }
  if (funding.liveTopUp.env.reason === "kill_switch_active") {
    return isZh(locale) ? "Kill switch 已啟用" : "Kill switch active";
  }
  return funding.liveTopUp.env.reason;
}

function emptyCopy({
  kind,
  portfolio,
  walletState,
  locale
}: {
  kind: PortfolioTab;
  portfolio: PredictionPortfolioViewModel;
  walletState: WalletConnectionViewState;
  locale?: string;
}) {
  if (kind === "orders") {
    return {
      title: isZh(locale) ? "未載入真實掛單" : "No open orders loaded",
      description: isZh(locale)
        ? "V2 尚未接入真實 open orders adapter，所以不會顯示推測掛單。"
        : "V2 has no real open-orders adapter wired here, so it does not display inferred orders."
    };
  }

  if (walletState.status === "unsupported_chain") {
    return {
      title: isZh(locale) ? "請切換至 Polygon" : "Switch to Polygon",
      description: isZh(locale)
        ? "切換至 Polygon 後才會讀取真實賬戶資料。"
        : "Real account data is shown only after the connected wallet is on Polygon."
    };
  }

  if (portfolio.status === "disconnected") {
    return {
      title: isZh(locale) ? "連接錢包以查看真實資料" : "Connect wallet to view real data",
      description: isZh(locale)
        ? "未連接錢包時不顯示持倉、成交、餘額或掛單。"
        : "Positions, fills, balances, and orders stay hidden until a wallet is connected."
    };
  }

  if (portfolio.status === "unavailable") {
    return {
      title: isZh(locale) ? "賬戶資料暫不可用" : "Account data unavailable",
      description: portfolio.error
        ? portfolio.error
        : isZh(locale)
          ? "上游未返回可驗證的賬戶資料。"
          : "The upstream account source did not return verifiable data."
    };
  }

  return kind === "positions"
    ? {
        title: isZh(locale) ? "沒有真實持倉" : "No real positions returned",
        description: isZh(locale)
          ? "此錢包目前沒有 V2 可驗證的持倉資料。"
          : "This wallet currently has no positions returned by the V2 account adapter."
      }
    : {
        title: isZh(locale) ? "沒有真實成交" : "No real fills returned",
        description: isZh(locale)
          ? "此錢包目前沒有 V2 可驗證的成交資料。"
          : "This wallet currently has no fills returned by the V2 account adapter."
      };
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
  const walletState = useWalletConnectionState();

  return (
    <PortfolioViewContent
      portfolio={portfolio}
      funding={funding}
      locale={locale}
      walletState={walletState}
    />
  );
}

export function PortfolioViewContent({
  portfolio,
  funding,
  locale,
  walletState
}: {
  portfolio: PredictionPortfolioViewModel;
  funding: FundingPanelViewModel;
  locale?: string;
  walletState: WalletConnectionViewState;
}) {
  const [activeTab, setActiveTab] = useState<PortfolioTab>("positions");
  const [copied, setCopied] = useState(false);
  const totalCurrentValue =
    portfolio.pnl.status === "available" ? portfolio.pnl.totalCurrentValue : null;
  const walletConnected =
    walletState.status === "connected" || walletState.status === "unsupported_chain";
  const addressLabel = walletConnected
    ? walletState.label
    : portfolio.addressLabel ?? (isZh(locale) ? "未連接錢包" : "No wallet connected");
  const walletAddress = walletConnected ? walletState.address : null;
  const portfolioTitle =
    portfolio.status === "ready"
      ? formatCurrency(totalCurrentValue)
      : walletConnected
        ? isZh(locale)
          ? "等待真實資料"
          : "Awaiting real data"
        : isZh(locale)
          ? "連接錢包"
          : "Connect wallet";
  const portfolioSubtitle =
    portfolio.status === "ready"
      ? isZh(locale)
        ? `賬戶 ${addressLabel}`
        : `Account ${addressLabel}`
      : walletConnected
        ? walletStatusLabel(walletState, locale)
        : isZh(locale)
          ? "連接錢包後才會載入真實持倉、成交及資金狀態。"
          : "Real positions, fills, and funding readiness appear after wallet connection.";

  async function copyAddress() {
    if (!walletAddress || !navigator.clipboard) {
      return;
    }

    await navigator.clipboard.writeText(walletAddress);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1200);
  }

  return (
    <main className="app-container-sm py-8">
      <div className="mx-auto grid gap-6">
        <section className="grid gap-4 md:grid-cols-[minmax(0,1.05fr)_minmax(280px,0.95fr)]">
          <div className="relative min-h-[244px] overflow-hidden rounded-lg border border-[var(--border)] bg-[var(--card)] p-4 shadow-[var(--panel-shadow)]">
            <div className="flex items-start justify-between gap-3">
              <div className="flex min-w-0 items-start gap-3">
                <div className="grid size-12 shrink-0 place-items-center rounded-full border border-[var(--border)] bg-[var(--muted)] text-[var(--foreground)]">
                  <UserRound className="size-5" aria-hidden="true" />
                </div>
                <div className="min-w-0 space-y-1">
                  <span className="text-sm font-semibold tracking-wide text-[var(--muted-foreground)]">
                    {isZh(locale) ? "投資組合" : "Portfolio"}
                  </span>
                  <div className="truncate text-3xl font-bold leading-tight text-[var(--foreground)] sm:text-4xl">
                    {portfolioTitle}
                  </div>
                  <div className="max-w-xl text-sm font-semibold text-[var(--muted-foreground)]">
                    {portfolioSubtitle}
                  </div>
                </div>
              </div>

              <button
                type="button"
                disabled={!walletAddress}
                onClick={() => {
                  void copyAddress();
                }}
                aria-label={isZh(locale) ? "複製錢包地址" : "Copy wallet address"}
                className="focus-ring grid size-10 shrink-0 place-items-center rounded-full border border-[var(--border)] bg-[var(--background)] text-[var(--muted-foreground)] shadow-sm transition hover:text-[var(--foreground)] disabled:cursor-not-allowed disabled:opacity-45"
              >
                {copied ? (
                  <ClipboardCheck className="size-4 text-[var(--yes)]" aria-hidden="true" />
                ) : (
                  <Copy className="size-4" aria-hidden="true" />
                )}
              </button>
            </div>

            <div className="mt-8 grid grid-cols-3 gap-2.5">
              <SummaryStat
                label={isZh(locale) ? "持倉" : "Positions"}
                value={formatCompactNumber(portfolio.positions.length)}
              />
              <SummaryStat
                label={isZh(locale) ? "成交" : "Fills"}
                value={formatCompactNumber(portfolio.fills.length)}
              />
              <SummaryStat
                label={isZh(locale) ? "價值" : "Value"}
                value={portfolio.pnl.status === "available" ? formatCurrency(totalCurrentValue) : "--"}
              />
            </div>
          </div>

          <div className="min-h-[244px] rounded-lg border border-[var(--border)] bg-[var(--card)] p-4 shadow-[var(--panel-shadow)]">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="size-4 text-[var(--primary)]" aria-hidden="true" />
                <h2 className="text-base font-semibold text-[var(--foreground)]">
                  {isZh(locale) ? "賬戶準備狀態" : "Account readiness"}
                </h2>
              </div>
              <span className="rounded-full border border-[var(--border)] px-2.5 py-1 text-xs font-bold text-[var(--muted-foreground)]">
                V2
              </span>
            </div>

            <div className="mt-5 grid gap-2 sm:grid-cols-2">
              <ReadinessCard
                icon={<WalletCards className="size-4" aria-hidden="true" />}
                label={isZh(locale) ? "錢包" : "Wallet"}
                value={walletStatusLabel(walletState, locale)}
                tone={walletState.status === "connected" ? "ready" : walletState.status === "unsupported_chain" ? "warning" : "blocked"}
              />
              <ReadinessCard
                icon={<ShieldCheck className="size-4" aria-hidden="true" />}
                label={isZh(locale) ? "網絡" : "Network"}
                value={
                  walletState.status === "unsupported_chain"
                    ? isZh(locale)
                      ? "請切換至 Polygon"
                      : "Switch to Polygon"
                    : SUPPORTED_WALLET_CHAIN_NAME
                }
                tone={walletState.status === "unsupported_chain" ? "warning" : "ready"}
              />
              <ReadinessCard
                icon={<ReceiptText className="size-4" aria-hidden="true" />}
                label={isZh(locale) ? "Deposit Wallet" : "Deposit wallet"}
                value={depositWalletStatusLabel(funding, locale)}
                tone={funding.liveTopUp.depositWallet.status === "available" ? "ready" : "blocked"}
              />
              <ReadinessCard
                icon={<Ban className="size-4" aria-hidden="true" />}
                label={isZh(locale) ? "Live top-up" : "Live top-up"}
                value={topUpGateLabel(funding, locale)}
                tone={funding.liveTopUp.env.status === "ready" ? "ready" : "blocked"}
              />
            </div>
          </div>
        </section>

        {portfolio.status === "disconnected" ? (
          <StatusBanner status="empty">
            {isZh(locale)
              ? "未連接錢包，因此不顯示餘額、持倉、成交或掛單。"
              : "No wallet session is active, so balances, positions, fills, and orders are not displayed."}
          </StatusBanner>
        ) : null}
        {walletState.status === "unsupported_chain" ? (
          <StatusBanner status="unavailable">
            {isZh(locale)
              ? "錢包已連接但網絡不正確。請切換至 Polygon 後再讀取真實賬戶資料。"
              : "Wallet connected on the wrong network. Switch to Polygon before loading real account data."}
          </StatusBanner>
        ) : null}
        {portfolio.status === "unavailable" ? (
          <StatusBanner status="unavailable">
            {isZh(locale)
              ? `投資組合資料暫不可用${portfolio.error ? `：${portfolio.error}` : "。"}`
              : `Portfolio data is unavailable${portfolio.error ? `: ${portfolio.error}` : "."}`}
          </StatusBanner>
        ) : null}

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_21.25rem]">
          <section className="overflow-hidden rounded-lg border border-[var(--border)] bg-[var(--card)] shadow-[var(--panel-shadow)]">
            <div className="relative">
              <div className="flex items-center gap-6 overflow-x-auto px-4 pt-4 sm:px-6">
                {portfolioTabs.map((tab) => (
                  <PortfolioTabButton
                    key={tab.id}
                    active={activeTab === tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    label={tab.label}
                    count={
                      tab.id === "positions"
                        ? portfolio.positions.length
                        : tab.id === "fills"
                          ? portfolio.fills.length
                          : null
                    }
                  >
                    {tab.label}
                  </PortfolioTabButton>
                ))}
              </div>
              <div className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-[var(--border)]" />
            </div>

            {activeTab === "positions" ? (
              <PositionsTable portfolio={portfolio} walletState={walletState} locale={locale} />
            ) : activeTab === "fills" ? (
              <FillsTable portfolio={portfolio} walletState={walletState} locale={locale} />
            ) : (
              <OpenOrdersTable portfolio={portfolio} walletState={walletState} locale={locale} />
            )}
          </section>

          <aside className="lg:sticky lg:top-[9.5rem] lg:self-start">
            <FundingPanelContent funding={funding} locale={locale} walletState={walletState} />
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

function ReadinessCard({
  icon,
  label,
  value,
  tone
}: {
  icon: ReactNode;
  label: string;
  value: string;
  tone: "ready" | "warning" | "blocked";
}) {
  return (
    <div className="min-h-[86px] rounded-lg border border-[var(--border)] bg-[var(--muted)] p-3">
      <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-[var(--muted-foreground)]">
        <span
          className={
            tone === "ready"
              ? "text-[var(--yes)]"
              : tone === "warning"
                ? "text-[var(--warning)]"
                : "text-[var(--muted-foreground)]"
          }
        >
          {icon}
        </span>
        <span>{label}</span>
      </div>
      <div className="mt-2 flex items-start gap-2">
        <span
          className={
            tone === "ready"
              ? "mt-0.5 shrink-0 text-[var(--yes)]"
              : tone === "warning"
                ? "mt-0.5 shrink-0 text-[var(--warning)]"
                : "mt-0.5 shrink-0 text-[var(--muted-foreground)]"
          }
        >
          <ReadinessToneIcon tone={tone} />
        </span>
        <div className="min-w-0 break-words text-sm font-semibold text-[var(--foreground)]">
          {value}
        </div>
      </div>
    </div>
  );
}

function PortfolioTabButton({
  active,
  children,
  count,
  label,
  onClick
}: {
  active: boolean;
  children: ReactNode;
  count: number | null;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={count === null ? label : `${label} ${count}`}
      className={
        active
          ? "focus-ring relative border-b-2 border-[var(--primary)] pb-3 text-sm font-semibold text-[var(--foreground)] transition-colors"
          : "focus-ring relative border-b-2 border-transparent pb-3 text-sm font-semibold text-[var(--muted-foreground)] transition-colors hover:text-[var(--foreground)]"
      }
    >
      <span className="inline-flex items-center gap-2 whitespace-nowrap">
        {children}
        {count !== null ? (
          <span className="rounded-full bg-[var(--muted)] px-1.5 py-0.5 text-[11px] font-bold text-[var(--muted-foreground)]">
            {count}
          </span>
        ) : null}
      </span>
    </button>
  );
}

function PositionsTable({
  portfolio,
  walletState,
  locale
}: {
  portfolio: PredictionPortfolioViewModel;
  walletState: WalletConnectionViewState;
  locale?: string;
}) {
  const hasPositions = portfolio.positions.length > 0;
  const copy = emptyCopy({ kind: "positions", portfolio, walletState, locale });

  return (
    <div className="relative w-full overflow-x-auto">
      <table className="w-full min-w-[680px] table-fixed border-collapse">
        <thead>
          <tr className="border-b border-[var(--border)]">
            <TableHeader className="w-[46%] text-left">{isZh(locale) ? "市場" : "Market"}</TableHeader>
            <TableHeader className="w-[18%] text-left">{isZh(locale) ? "結果" : "Outcome"}</TableHeader>
            <TableHeader className="w-[18%] text-right">{isZh(locale) ? "份額" : "Shares"}</TableHeader>
            <TableHeader className="w-[18%] text-right">{isZh(locale) ? "價值" : "Value"}</TableHeader>
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
        <TableEmptyState
          icon={<ReceiptText className="size-5" aria-hidden="true" />}
          title={copy.title}
          description={copy.description}
        />
      ) : null}
    </div>
  );
}

function FillsTable({
  portfolio,
  walletState,
  locale
}: {
  portfolio: PredictionPortfolioViewModel;
  walletState: WalletConnectionViewState;
  locale?: string;
}) {
  const hasFills = portfolio.fills.length > 0;
  const copy = emptyCopy({ kind: "fills", portfolio, walletState, locale });

  return (
    <div className="relative w-full overflow-x-auto">
      <table className="w-full min-w-[920px] table-fixed border-collapse">
        <thead>
          <tr className="border-b border-[var(--border)]">
            <TableHeader className="w-[38%] text-left">{isZh(locale) ? "市場" : "Market"}</TableHeader>
            <TableHeader className="w-[12%] text-center">{isZh(locale) ? "方向" : "Side"}</TableHeader>
            <TableHeader className="w-[16%] text-left">{isZh(locale) ? "結果" : "Outcome"}</TableHeader>
            <TableHeader className="w-[12%] text-right">{isZh(locale) ? "價格" : "Price"}</TableHeader>
            <TableHeader className="w-[12%] text-right">{isZh(locale) ? "數量" : "Size"}</TableHeader>
            <TableHeader className="w-[10%] text-right">{isZh(locale) ? "時間" : "Time"}</TableHeader>
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
        <TableEmptyState
          icon={<Activity className="size-5" aria-hidden="true" />}
          title={copy.title}
          description={copy.description}
        />
      ) : null}
    </div>
  );
}

function OpenOrdersTable({
  portfolio,
  walletState,
  locale
}: {
  portfolio: PredictionPortfolioViewModel;
  walletState: WalletConnectionViewState;
  locale?: string;
}) {
  const copy = emptyCopy({ kind: "orders", portfolio, walletState, locale });

  return (
    <div className="relative w-full overflow-x-auto">
      <table className="w-full min-w-[860px] table-fixed border-collapse">
        <thead>
          <tr className="border-b border-[var(--border)]">
            <TableHeader className="w-[34%] text-left">{isZh(locale) ? "市場" : "Market"}</TableHeader>
            <TableHeader className="w-[12%] text-center">{isZh(locale) ? "方向" : "Side"}</TableHeader>
            <TableHeader className="w-[16%] text-left">{isZh(locale) ? "結果" : "Outcome"}</TableHeader>
            <TableHeader className="w-[12%] text-right">{isZh(locale) ? "價格" : "Price"}</TableHeader>
            <TableHeader className="w-[12%] text-right">{isZh(locale) ? "數量" : "Size"}</TableHeader>
            <TableHeader className="w-[14%] text-right">{isZh(locale) ? "狀態" : "Status"}</TableHeader>
          </tr>
        </thead>
      </table>
      <TableEmptyState
        icon={<ListOrdered className="size-5" aria-hidden="true" />}
        title={copy.title}
        description={copy.description}
      />
    </div>
  );
}

function TableEmptyState({
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

function ReadinessToneIcon({ tone }: { tone: "ready" | "warning" | "blocked" }) {
  if (tone === "ready") {
    return <CheckCircle2 className="size-3.5" aria-hidden="true" />;
  }
  if (tone === "warning") {
    return <TriangleAlert className="size-3.5" aria-hidden="true" />;
  }
  return <Ban className="size-3.5" aria-hidden="true" />;
}
