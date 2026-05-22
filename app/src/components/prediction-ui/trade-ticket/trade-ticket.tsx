"use client";

import { ChevronDown, LockKeyhole, ShieldCheck } from "lucide-react";
import { useMemo, useState } from "react";
import type { PredictionTradeTicketViewModel } from "@/features/prediction/types";

type Outcome = {
  label: string;
  price: number | null;
  tokenId: string | null;
};

function isZh(locale?: string) {
  return locale?.toLowerCase().startsWith("zh") ?? false;
}

function disabledReasonLabel(reason: string | null, locale?: string) {
  const en: Record<string, string> = {
    connect_wallet: "Connect a wallet before trading.",
    deposit_wallet_unavailable: "Deposit wallet status is unavailable.",
    deploy_deposit_wallet: "Deposit wallet must be deployed before trading.",
    top_up_required: "Top-up required: pUSD must be in the deposit wallet.",
    balance_allowance_unavailable: "Balance and allowance are unavailable.",
    sync_clob_balance: "Sync CLOB balance before trading.",
    approval_required: "Exact pUSD approval is required before trading.",
    live_top_up_disabled: "Live top-up gates are disabled on the server.",
    market_not_tradable: "Trading is not available for this market.",
    missing_token_id: "Token unavailable for this outcome."
  };
  const zh: Record<string, string> = {
    connect_wallet: "請先連接錢包。",
    deposit_wallet_unavailable: "Deposit Wallet 狀態不可用。",
    deploy_deposit_wallet: "交易前必須先部署 Deposit Wallet。",
    top_up_required: "需要充值：pUSD 必須在 Deposit Wallet 內。",
    balance_allowance_unavailable: "餘額及授權狀態不可用。",
    sync_clob_balance: "交易前請先同步 CLOB 餘額。",
    approval_required: "交易前需要精確 pUSD 授權。",
    live_top_up_disabled: "伺服器 live top-up 閘門未啟用。",
    market_not_tradable: "此市場暫不可交易。",
    missing_token_id: "此選項沒有可用 token。"
  };
  if (!reason) {
    return isZh(locale)
      ? "Live submit remains locked until all real funding checks pass."
      : "Live submit remains locked until all real funding checks pass.";
  }
  return (isZh(locale) ? zh : en)[reason] ?? reason;
}

export function TradeTicket({
  ticket,
  outcomes,
  locale
}: {
  ticket: PredictionTradeTicketViewModel;
  outcomes: Outcome[];
  locale?: string;
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
              {option === "BUY" ? (isZh(locale) ? "買入" : "Buy") : isZh(locale) ? "賣出" : "Sell"}
            </button>
          ))}
        </div>

        <button
          type="button"
          className="focus-ring inline-flex items-center gap-1 pb-2 text-sm font-semibold text-[var(--foreground)]"
          aria-label="Order type"
        >
          {isZh(locale) ? "市價" : "Market"}
          <ChevronDown className="size-4 text-[var(--muted-foreground)]" aria-hidden="true" />
        </button>
      </div>

      <div className="mb-3 flex items-center justify-between gap-3 rounded-md bg-[var(--muted)] px-3 py-2">
        <div className="text-xs font-semibold text-[var(--muted-foreground)]">
          {isZh(locale) ? "交易狀態" : "Trading status"}
        </div>
        <div className="flex items-center gap-1 text-xs font-semibold text-[var(--foreground)]">
          <ShieldCheck className="size-4" aria-hidden="true" />
          {isZh(locale) ? "Fail-closed" : "Fail-closed"}
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
          <span className="block text-lg font-medium">{isZh(locale) ? "金額" : "Amount"}</span>
          <span className="block text-xs text-[var(--muted-foreground)]">
            {isZh(locale) ? "需要錢包" : "Wallet required"}
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
          {isZh(locale) ? "市場價格" : "Market price"}
          <input
            className="h-11 w-full rounded-md border border-[var(--border)] bg-[var(--input)] px-3 text-sm font-semibold text-[var(--foreground)] outline-none"
            value={selected?.price ?? ""}
            readOnly
            aria-label="Price"
          />
        </label>
        <label className="space-y-1 text-xs font-semibold text-[var(--muted-foreground)]">
          {isZh(locale) ? "已選擇" : "Selected"}
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
          {isZh(locale) ? "提交已封鎖" : "Submit blocked"}
        </button>
      </div>

      <p className="mt-3 text-xs leading-5 text-[var(--muted-foreground)]">
        {unavailable
          ? disabledReasonLabel(ticket.disabledReason, locale)
          : isZh(locale)
            ? "錢包、充值及伺服器閘門均通過後才可提交。"
            : "Wallet, funding, and server gates passed; submit still uses the guarded live path."}
      </p>
    </section>
  );
}
