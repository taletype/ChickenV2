"use client";

import { ChevronDown, LockKeyhole, ShieldCheck } from "lucide-react";
import { useMemo, useState } from "react";
import type {
  PredictionMarketCardViewModel,
  PredictionTradeTicketViewModel
} from "@/features/prediction/types";
import { useWalletConnectionState } from "@/hooks/use-wallet-connection-state";

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
    unsupported_chain: "Switch to Polygon before trading.",
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
    unsupported_chain: "交易前請切換至 Polygon。",
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

function formatPercent(value: number | null) {
  return value === null ? "N/A" : `${Math.round(value * 100)}%`;
}

function outcomeTone(index: number) {
  return index === 1
    ? {
        surface: "bg-[var(--no)]",
        depth: "bg-[color-mix(in_srgb,var(--no)_80%,black)]"
      }
    : {
        surface: "bg-[var(--yes)]",
        depth: "bg-[color-mix(in_srgb,var(--yes)_80%,black)]"
      };
}

function OutcomeButton({
  outcome,
  index,
  selected,
  onSelect
}: {
  outcome: Outcome;
  index: number;
  selected: boolean;
  onSelect: () => void;
}) {
  const tone = outcomeTone(index);

  return (
    <div className="relative min-w-0 flex-1 overflow-hidden rounded-lg pb-[5px]">
      <div
        className={
          selected
            ? `pointer-events-none absolute inset-x-0 bottom-0 h-4 rounded-b-lg ${tone.depth}`
            : "pointer-events-none absolute inset-x-0 bottom-0 h-4 rounded-b-lg bg-[var(--border)]"
        }
      />
      <button
        type="button"
        disabled={!outcome.tokenId}
        onClick={onSelect}
        className={
          selected
            ? `focus-ring relative flex h-12 w-full translate-y-0 items-center justify-center gap-1 overflow-hidden rounded-lg px-3 text-sm font-semibold text-white shadow-sm transition-transform hover:translate-y-px active:translate-y-0.5 ${tone.surface}`
            : "focus-ring relative flex h-12 w-full translate-y-0 items-center justify-center gap-1 overflow-hidden rounded-lg border border-[var(--border)] bg-[var(--card)] px-3 text-sm font-semibold text-[var(--foreground)] transition-transform hover:translate-y-px active:translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-55"
        }
      >
        <span className="min-w-0 truncate opacity-75">{outcome.label}</span>
        <span className="shrink-0 text-base font-bold">{formatPercent(outcome.price)}</span>
      </button>
    </div>
  );
}

function ReadinessRow({
  label,
  value
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start justify-between gap-3 border-b border-[var(--border)] py-2 last:border-0 last:pb-0">
      <span className="text-xs font-medium text-[var(--muted-foreground)]">{label}</span>
      <span className="max-w-[12rem] text-right text-xs font-semibold leading-5 text-[var(--foreground)]">
        {value}
      </span>
    </div>
  );
}

export function TradeTicket({
  ticket,
  market,
  outcomes,
  locale
}: {
  ticket: PredictionTradeTicketViewModel;
  market: PredictionMarketCardViewModel;
  outcomes: Outcome[];
  locale?: string;
}) {
  const walletState = useWalletConnectionState();
  const [side, setSide] = useState<"BUY" | "SELL">(ticket.side);
  const [selectedTokenId, setSelectedTokenId] = useState(ticket.selectedTokenId);
  const selected = useMemo(
    () =>
      outcomes.find((outcome) => outcome.tokenId === selectedTokenId) ??
      outcomes.find((outcome) => outcome.tokenId) ??
      null,
    [outcomes, selectedTokenId]
  );
  const clientDisabledReason =
    walletState.status === "unsupported_chain"
      ? "unsupported_chain"
      : !selected?.tokenId
        ? "missing_token_id"
      : ticket.disabledReason;
  const unavailable =
    ticket.status !== "ready" ||
    !selected?.tokenId ||
    walletState.status === "unsupported_chain";
  const amountChips =
    side === "BUY" ? ["+$1", "+$5", "+$10", "+$100"] : ["25%", "50%", "75%"];
  const readinessStatus = unavailable
    ? isZh(locale)
      ? "已封鎖"
      : "Blocked"
    : isZh(locale)
      ? "可檢查"
      : "Ready for checks";

  return (
    <section className="w-full rounded-xl border border-[var(--border)] bg-[var(--card)] p-4 shadow-[var(--panel-shadow)] lg:w-[21.25rem]">
      <div className="mb-4 flex items-center gap-3.5">
        <div className="grid size-12 shrink-0 place-items-center overflow-hidden rounded-md bg-[var(--muted)]">
          {market.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={market.image} alt="" className="h-full w-full object-cover" />
          ) : (
            <ShieldCheck className="size-5 text-[var(--muted-foreground)]" aria-hidden="true" />
          )}
        </div>
        <span className="line-clamp-2 text-base font-bold leading-tight text-[var(--foreground)]">
          {market.question}
        </span>
      </div>

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
          className="focus-ring group inline-flex items-center gap-1 bg-transparent pb-2 text-sm font-semibold text-[var(--foreground)]"
          aria-label="Order type"
          aria-haspopup="menu"
          aria-expanded="false"
        >
          {isZh(locale) ? "市價" : "Market"}
          <ChevronDown
            className="size-4 text-[var(--muted-foreground)] transition-transform group-hover:rotate-180"
            aria-hidden="true"
          />
        </button>
      </div>

      <div className="mb-2 flex gap-2">
        {outcomes.map((outcome, index) => (
          <OutcomeButton
            key={`${outcome.label}-${outcome.tokenId ?? "missing"}`}
            outcome={outcome}
            index={index}
            selected={selected?.tokenId === outcome.tokenId}
            onSelect={() => {
              if (outcome.tokenId) {
                setSelectedTokenId(outcome.tokenId);
              }
            }}
          />
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

      <div className="mb-4 flex flex-wrap gap-2">
        {amountChips.map((chip) => (
          <button
            key={chip}
            type="button"
            disabled
            className="inline-flex h-8 min-w-[3.25rem] cursor-not-allowed items-center justify-center rounded-md border border-[var(--border)] px-2 text-xs font-semibold text-[var(--muted-foreground)] opacity-60"
          >
            {chip}
          </button>
        ))}
      </div>

      <div className="mb-4 grid grid-cols-2 gap-3">
        <label className="space-y-1 text-xs font-semibold text-[var(--muted-foreground)]">
          {isZh(locale) ? "市場價格" : "Market price"}
          <input
            className="h-11 w-full rounded-md border border-[var(--border)] bg-[var(--input)] px-3 text-sm font-semibold text-[var(--foreground)] outline-none"
            value={selected ? formatPercent(selected.price) : ""}
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

      <div className="mb-4 rounded-md bg-[var(--muted)] px-3 py-1">
        <ReadinessRow
          label={isZh(locale) ? "交易狀態" : "Trading status"}
          value={readinessStatus}
        />
        <ReadinessRow
          label={isZh(locale) ? "資金檢查" : "Funding checks"}
          value={
            ticket.funding.topUpReady
              ? isZh(locale)
                ? "已通過"
                : "Passed"
              : disabledReasonLabel(ticket.funding.step, locale)
          }
        />
        <ReadinessRow
          label={isZh(locale) ? "提交" : "Submit"}
          value={isZh(locale) ? "保持封鎖" : "Fail-closed"}
        />
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
          ? disabledReasonLabel(clientDisabledReason, locale)
          : isZh(locale)
            ? "錢包、充值及伺服器閘門均通過後才可提交。"
            : "Wallet, funding, and server gates passed; submit still uses the guarded live path."}
      </p>
    </section>
  );
}
