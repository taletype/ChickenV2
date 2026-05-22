"use client";

import {
  ArrowUpRight,
  Ban,
  CheckCircle2,
  CircleDollarSign,
  Copy,
  QrCode,
  RotateCw,
  TriangleAlert
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useWalletConnectionState } from "@/hooks/use-wallet-connection-state";
import {
  SUPPORTED_WALLET_CHAIN_NAME,
  type WalletConnectionViewState
} from "@/lib/wallet/appkit";

type FundingPanelViewModel = Awaited<ReturnType<
  typeof import("@/features/prediction/funding/adapter").buildFundingPanelViewModel
>>;
type LiveTopUpFundingSnapshot = FundingPanelViewModel["liveTopUp"];

function formatPusd(value: string | null) {
  if (!value) {
    return "--";
  }
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    return value;
  }
  return `${parsed.toLocaleString("en", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })} pUSD`;
}

function formatBaseUnits(value: string) {
  try {
    const atoms = BigInt(value);
    const whole = atoms / 1_000_000n;
    const fractional = atoms % 1_000_000n;
    return formatPusd(`${whole}.${fractional.toString().padStart(6, "0")}`);
  } catch {
    return value;
  }
}

function isZh(locale?: string) {
  return locale?.toLowerCase().startsWith("zh") ?? false;
}

function readinessLabel(
  step: FundingPanelViewModel["liveTopUp"]["readiness"]["step"],
  locale?: string
) {
  const en = {
    connect_wallet: "Connect wallet",
    deposit_wallet_unavailable: "Wallet status unavailable",
    deploy_deposit_wallet: "Deploy deposit wallet",
    top_up_required: "Top up required",
    balance_allowance_unavailable: "Balance unavailable",
    sync_clob_balance: "Sync CLOB balance",
    approval_required: "Approval required",
    ready: "Ready"
  } satisfies Record<typeof step, string>;
  const zh = {
    connect_wallet: "連接錢包",
    deposit_wallet_unavailable: "錢包狀態不可用",
    deploy_deposit_wallet: "部署 Deposit Wallet",
    top_up_required: "需要充值",
    balance_allowance_unavailable: "餘額不可用",
    sync_clob_balance: "同步 CLOB 餘額",
    approval_required: "需要授權",
    ready: "已準備好"
  } satisfies Record<typeof step, string>;
  return (isZh(locale) ? zh : en)[step];
}

function deployedStatusLabel(
  status: LiveTopUpFundingSnapshot["depositWallet"],
  locale?: string
) {
  if (status.status !== "available") {
    return isZh(locale) ? "不可用" : "Unavailable";
  }
  if (status.deployedStatus === "deployed") {
    return isZh(locale) ? "已部署" : "Deployed";
  }
  if (status.deployedStatus === "not_deployed") {
    return isZh(locale) ? "未部署" : "Not deployed";
  }
  return isZh(locale) ? "未知" : "Unknown";
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

function approvalSubmitLabel(
  liveTopUp: LiveTopUpFundingSnapshot,
  locale?: string
) {
  if (liveTopUp.env.status !== "ready") {
    return isZh(locale)
      ? "提交已停用：live top-up 閘門未通過"
      : "Submit disabled: live top-up gates are closed";
  }
  if (!liveTopUp.readiness.topUpReady) {
    return isZh(locale)
      ? "提交已停用：等待真實充值狀態"
      : "Submit disabled: waiting for real top-up readiness";
  }
  return isZh(locale)
    ? "提交已停用：瀏覽器簽署尚未接線"
    : "Submit disabled: browser signing is not wired";
}

function checklistLabel(
  id: FundingPanelViewModel["liveTopUp"]["readiness"]["checklist"][number]["id"],
  fallback: string,
  locale?: string
) {
  if (!isZh(locale)) {
    return fallback;
  }
  return {
    wallet: "已連接錢包",
    deposit_wallet_address: "Deposit Wallet 地址",
    deposit_wallet_deployed: "Deposit Wallet 已部署",
    deposit_wallet_pusd: "Deposit Wallet pUSD",
    clob_balance: "CLOB 餘額同步",
    clob_allowance: "CLOB 授權",
    live_top_up_gate: "Live top-up 閘門"
  }[id];
}

export function FundingPanel({
  funding,
  locale
}: {
  funding: FundingPanelViewModel;
  locale?: string;
}) {
  const walletState = useWalletConnectionState();

  return (
    <FundingPanelContent
      funding={funding}
      locale={locale}
      walletState={walletState}
    />
  );
}

export function FundingPanelContent({
  funding,
  locale,
  walletState
}: {
  funding: FundingPanelViewModel;
  locale?: string;
  walletState: WalletConnectionViewState;
}) {
  const liveTopUp = useLiveTopUpSnapshot(funding.liveTopUp, walletState);
  const method = funding.methods[0] ?? null;
  const depositWallet =
    liveTopUp.depositWallet.status === "available" ? liveTopUp.depositWallet : null;
  const depositWalletAddress = depositWallet?.depositWalletAddress ?? null;
  const depositPusd = liveTopUp.balances.depositWalletPusd;
  const connectedPusd = liveTopUp.balances.connectedWalletPusd;
  const clob = liveTopUp.balances.clob;
  const [copied, setCopied] = useState(false);
  const approvalPreview = liveTopUp.approvalPreview;

  return (
    <section className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-4 shadow-[var(--panel-shadow)]">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-base font-medium">{isZh(locale) ? "充值" : "Funding"}</h2>
        <CircleDollarSign className="size-5 text-[var(--primary)]" aria-hidden="true" />
      </div>

      <div
        className={
          walletState.status === "unsupported_chain"
            ? "mt-4 rounded-md border border-[var(--warning)] bg-[color-mix(in_srgb,var(--warning)_10%,white)] p-3"
            : "mt-4 rounded-md border border-[var(--border)] bg-[var(--muted)] p-3"
        }
      >
        <div className="text-xs font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">
          {isZh(locale) ? "錢包狀態" : "Wallet state"}
        </div>
        <div className="mt-1 break-all text-sm font-bold text-[var(--foreground)]">
          {walletStatusLabel(walletState, locale)}
        </div>
      </div>

      <div className="mt-3 rounded-md bg-[var(--muted)] p-3">
        <div className="text-xs font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">
          {isZh(locale) ? "充值準備狀態" : "Top-up readiness"}
        </div>
        <div className="mt-1 text-sm font-bold text-[var(--foreground)]">
          {readinessLabel(liveTopUp.readiness.step, locale)}
        </div>
      </div>

      <div className="mt-3 rounded-md border border-[var(--border)] p-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="text-xs font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">
              {isZh(locale) ? "Deposit Wallet" : "Deposit wallet"}
            </div>
            <div className="mt-1 break-all text-sm font-semibold text-[var(--foreground)]">
              {depositWalletAddress ??
                (isZh(locale)
                  ? "未取得真實錢包地址前不可用"
                  : "Unavailable until a real wallet address is known")}
            </div>
          </div>
          <div className="grid size-14 shrink-0 place-items-center rounded-md border border-[var(--border)] bg-[var(--muted)]">
            <QrCode className="size-6 text-[var(--muted-foreground)]" aria-hidden="true" />
          </div>
        </div>
        <div className="mt-3 flex gap-2">
          <button
            type="button"
            disabled={!depositWalletAddress}
            onClick={() => {
              if (depositWalletAddress) {
                void navigator.clipboard?.writeText(depositWalletAddress);
                setCopied(true);
                window.setTimeout(() => setCopied(false), 1200);
              }
            }}
            className="focus-ring inline-flex h-9 flex-1 items-center justify-center gap-2 rounded-md border border-[var(--border)] px-3 text-xs font-bold text-[var(--foreground)] disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Copy className="size-4" aria-hidden="true" />
            {copied ? (isZh(locale) ? "已複製" : "Copied") : isZh(locale) ? "複製" : "Copy"}
          </button>
          <button
            type="button"
            disabled={!depositWalletAddress || liveTopUp.env.status !== "ready" || liveTopUp.account.status !== "connected"}
            onClick={() => {
              if (liveTopUp.account.status === "connected") {
                void fetch("/api/polymarket/deposit-wallet/sync-balance-allowance", {
                  method: "POST",
                  headers: { "content-type": "application/json" },
                  body: JSON.stringify({ address: liveTopUp.account.address })
                });
              }
            }}
            className="focus-ring inline-flex h-9 flex-1 items-center justify-center gap-2 rounded-md border border-[var(--border)] px-3 text-xs font-bold text-[var(--foreground)] disabled:cursor-not-allowed disabled:text-[var(--muted-foreground)] disabled:opacity-50"
          >
            <RotateCw className="size-4" aria-hidden="true" />
            {isZh(locale) ? "同步" : "Sync"}
          </button>
        </div>
      </div>

      <div className="mt-3 grid gap-2">
        <FundingMetric
          label={isZh(locale) ? "Deposit Wallet 狀態" : "Deposit wallet status"}
          value={deployedStatusLabel(liveTopUp.depositWallet, locale)}
        />
        <FundingMetric
          label={isZh(locale) ? "已連接錢包 pUSD" : "Connected wallet pUSD"}
          value={
            connectedPusd.status === "available"
              ? formatPusd(connectedPusd.formatted)
              : connectedPusd.reason
          }
        />
        <FundingMetric
          label={isZh(locale) ? "Deposit Wallet pUSD" : "Deposit wallet pUSD"}
          value={
            depositPusd.status === "available" ? formatPusd(depositPusd.formatted) : depositPusd.reason
          }
        />
        <FundingMetric
          label={isZh(locale) ? "CLOB 餘額 / 授權" : "CLOB balance / allowance"}
          value={
            clob.status === "available"
              ? `${formatPusd(String(clob.balance))} / ${formatPusd(String(clob.allowance))}`
              : clob.reason
          }
        />
      </div>

      <div className="mt-3 grid gap-2">
        {liveTopUp.readiness.checklist.map((item) => (
          <div
            key={item.id}
            className="flex min-h-9 items-center justify-between gap-3 rounded-md bg-[var(--muted)] px-3 py-2"
          >
            <span className="min-w-0 text-xs font-semibold text-[var(--muted-foreground)]">
              {checklistLabel(item.id, item.label, locale)}
            </span>
            <span
              className={
                item.state === "ready"
                  ? "inline-flex shrink-0 items-center gap-1 text-xs font-bold text-[var(--yes)]"
                  : "inline-flex shrink-0 items-center gap-1 text-xs font-bold text-[var(--warning)]"
              }
            >
              {item.state === "ready" ? (
                <CheckCircle2 className="size-3.5" aria-hidden="true" />
              ) : (
                <TriangleAlert className="size-3.5" aria-hidden="true" />
              )}
              {item.state}
            </span>
          </div>
        ))}
      </div>

      <div className="mt-3 rounded-md border border-[var(--border)] p-3">
        <div className="text-xs font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">
          {isZh(locale) ? "精確授權預覽" : "Exact approval preview"}
        </div>
        <div className="mt-2 grid gap-2">
          <FundingMetric
            label={isZh(locale) ? "金額" : "Amount"}
            value={
              approvalPreview.status === "ready"
                ? formatBaseUnits(approvalPreview.amountBaseUnits)
                : approvalPreview.code
            }
          />
          <FundingMetric
            label="Spender"
            value={
              approvalPreview.status === "ready"
                ? approvalPreview.spenderAddress
                : approvalPreview.code
            }
          />
          <FundingMetric
            label="Calls"
            value={
              approvalPreview.status === "ready"
                ? "1 approve call"
                : approvalPreview.code
            }
          />
        </div>
      </div>

      <button
        type="button"
        disabled
        className="mt-3 flex h-11 w-full cursor-not-allowed items-center justify-center gap-2 rounded-md border border-[var(--border)] bg-[var(--card)] px-4 text-sm font-bold text-[var(--muted-foreground)]"
      >
        <Ban className="size-4" aria-hidden="true" />
        {approvalSubmitLabel(liveTopUp, locale)}
      </button>

      {method ? (
        <a
          href={method.href}
          target="_blank"
          rel="noreferrer"
          className="focus-ring mt-4 flex h-11 items-center justify-center gap-2 rounded-md bg-[var(--primary)] px-4 text-sm font-bold text-white shadow-sm"
        >
          {isZh(locale) ? "充值" : "Top up"}
          <ArrowUpRight className="size-4" aria-hidden="true" />
        </a>
      ) : null}

      <button
        type="button"
        disabled
        className="mt-3 flex h-11 w-full cursor-not-allowed items-center justify-center gap-2 rounded-md border border-[var(--border)] bg-[var(--card)] px-4 text-sm font-bold text-[var(--muted-foreground)]"
      >
        <Ban className="size-4" aria-hidden="true" />
        {isZh(locale) ? "提取路徑未支援" : "Unsupported withdrawal path"}
      </button>
    </section>
  );
}

function useLiveTopUpSnapshot(
  initialSnapshot: LiveTopUpFundingSnapshot,
  walletState: WalletConnectionViewState
) {
  const address = walletState.status === "connected" ? walletState.address : null;
  const [snapshot, setSnapshot] = useState<LiveTopUpFundingSnapshot | null>(null);

  useEffect(() => {
    if (!address) {
      return;
    }

    const controller = new AbortController();
    const url = new URL(
      "/api/polymarket/deposit-wallet/status",
      window.location.origin
    );
    url.searchParams.set("address", address);

    void fetch(url, {
      cache: "no-store",
      headers: { accept: "application/json" },
      signal: controller.signal
    })
      .then((response) => (response.ok ? response.json() : null))
      .then((payload: LiveTopUpFundingSnapshot | null) => {
        if (
          payload?.account.status === "connected" &&
          payload.account.address === address
        ) {
          setSnapshot(payload);
        }
      })
      .catch(() => {});

    return () => {
      controller.abort();
    };
  }, [address]);

  return useMemo(() => {
    if (
      address &&
      snapshot?.account.status === "connected" &&
      snapshot.account.address === address
    ) {
      return snapshot;
    }

    return initialSnapshot;
  }, [address, initialSnapshot, snapshot]);
}

function FundingMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-[var(--border)] pb-2 last:border-0 last:pb-0">
      <span className="text-xs font-semibold text-[var(--muted-foreground)]">{label}</span>
      <span className="min-w-0 truncate text-right text-xs font-bold text-[var(--foreground)]">
        {value}
      </span>
    </div>
  );
}
