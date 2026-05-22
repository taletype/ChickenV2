"use client";

import {
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  CircleDashed,
  Loader2,
  LockKeyhole,
  PenLine,
  ShieldCheck
} from "lucide-react";
import { useMemo, useState } from "react";
import { useWalletClient } from "wagmi";
import type {
  PredictionMarketCardViewModel,
  PredictionTradeTicketViewModel
} from "@/features/prediction/types";
import { useWalletConnectionState } from "@/hooks/use-wallet-connection-state";
import type { EvmAddress } from "@/lib/wallet/address";

type Outcome = {
  label: string;
  price: number | null;
  tokenId: string | null;
};

type PreparedOrderResponse =
  | {
      status: "ready";
      order: Record<string, unknown>;
      orderType: "GTC" | "FOK";
      sdkSignatureSuffix: string;
      typedData: {
        domain: Record<string, unknown>;
        types: Record<string, Array<{ name: string; type: string }>>;
        primaryType: string;
        message: Record<string, unknown>;
      };
    }
  | {
      status: "blocked";
      code: string;
      message: string;
      diagnostics?: Record<string, unknown>;
    };

type PrepareUiState =
  | { status: "idle"; code: null; message: null }
  | { status: "preparing"; code: null; message: null }
  | { status: "ready"; code: null; message: string }
  | { status: "blocked" | "failed"; code: string; message: string }
  | { status: "signing"; code: null; message: string }
  | { status: "signed"; code: null; message: string };

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
    live_trading_disabled: "Live trading prepare gates are disabled on the server.",
    risk_disclosure_missing: "Accept the risk disclosure before preparing.",
    invalid_amount: "Enter a valid order size.",
    signing_payload_unavailable: "Browser signing payload is unavailable.",
    wallet_client_unavailable: "Wallet signing is unavailable in this session.",
    signed_submit_adapter_not_configured: "Signed submit adapter is not configured.",
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
    live_trading_disabled: "伺服器 live trading prepare 閘門未啟用。",
    risk_disclosure_missing: "請先確認風險提示。",
    invalid_amount: "請輸入有效訂單數量。",
    signing_payload_unavailable: "瀏覽器簽署資料不可用。",
    wallet_client_unavailable: "此錢包工作階段無法簽署。",
    signed_submit_adapter_not_configured: "Signed submit adapter 尚未設定。",
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

function readinessCheckLabel(id: string, fallback: string, locale?: string) {
  const en: Record<string, string> = {
    wallet_connected: "Wallet connected",
    polygon_chain: "Supported Polygon chain",
    market_tradable: "Market tradable",
    token_outcome_valid: "Token/outcome valid",
    deposit_wallet_known_deployed: "Deposit wallet known/deployed",
    pusd_balance_real: "pUSD balance real",
    clob_balance_real: "CLOB balance real",
    clob_allowance_ready: "CLOB allowance ready",
    l2_credentials_available: "L2 credentials available",
    signer_identity_valid: "Signer identity valid",
    live_trading_flag: "Live trading flag",
    submit_adapter_configured: "Submit adapter configured"
  };
  const zh: Record<string, string> = {
    wallet_connected: "錢包已連接",
    polygon_chain: "Polygon 網絡",
    market_tradable: "市場可交易",
    token_outcome_valid: "Token / 結果有效",
    deposit_wallet_known_deployed: "Deposit Wallet 已部署",
    pusd_balance_real: "pUSD 餘額真實",
    clob_balance_real: "CLOB 餘額真實",
    clob_allowance_ready: "CLOB 授權就緒",
    l2_credentials_available: "L2 憑證可用",
    signer_identity_valid: "簽署身份有效",
    live_trading_flag: "Live trading 旗標",
    submit_adapter_configured: "Submit adapter 設定"
  };

  return (isZh(locale) ? zh : en)[id] ?? fallback;
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
  state,
  value
}: {
  label: string;
  state: "ready" | "blocked" | "unavailable";
  value: string;
}) {
  const Icon =
    state === "ready" ? CheckCircle2 : state === "blocked" ? AlertTriangle : CircleDashed;
  const tone =
    state === "ready"
      ? "text-[var(--yes)]"
      : state === "blocked"
        ? "text-[var(--warning)]"
        : "text-[var(--muted-foreground)]";

  return (
    <div className="flex items-start justify-between gap-3 border-b border-[var(--border)] py-2 last:border-0 last:pb-0">
      <span className="text-xs font-medium text-[var(--muted-foreground)]">{label}</span>
      <span className="flex max-w-[13rem] items-start justify-end gap-1.5 text-right text-xs font-semibold leading-5 text-[var(--foreground)]">
        <Icon className={`mt-0.5 size-3.5 shrink-0 ${tone}`} aria-hidden="true" />
        <span>{value}</span>
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
  const { data: walletClient } = useWalletClient();
  const [side, setSide] = useState<"BUY" | "SELL">(ticket.side);
  const [selectedTokenId, setSelectedTokenId] = useState(ticket.selectedTokenId);
  const [amountInput, setAmountInput] = useState("");
  const [riskDisclosureAccepted, setRiskDisclosureAccepted] = useState(false);
  const [preparedOrder, setPreparedOrder] =
    useState<Extract<PreparedOrderResponse, { status: "ready" }> | null>(null);
  const [signedOrder, setSignedOrder] = useState<Record<string, unknown> | null>(null);
  const [prepareState, setPrepareState] = useState<PrepareUiState>({
    status: "idle",
    code: null,
    message: null
  });
  const selected = useMemo(
    () =>
      outcomes.find((outcome) => outcome.tokenId === selectedTokenId) ??
      outcomes.find((outcome) => outcome.tokenId) ??
      null,
    [outcomes, selectedTokenId]
  );
  const amount = Number(amountInput);
  const amountValid = Number.isFinite(amount) && amount > 0;
  const walletConnected =
    walletState.status === "connected" || walletState.status === "unsupported_chain";
  const polygonReady = walletState.status === "connected";
  const marketTradable = market.tradable;
  const tokenValid = Boolean(selected?.tokenId);
  const priceValid =
    typeof selected?.price === "number" && selected.price > 0 && selected.price < 1;
  const fundingReady =
    ticket.funding.topUpReady &&
    ticket.funding.depositWalletKnown &&
    ticket.funding.depositWalletDeployed &&
    ticket.funding.pusdBalanceReal &&
    ticket.funding.clobBalanceReal &&
    ticket.funding.clobBalanceReady &&
    ticket.funding.clobAllowanceReady &&
    ticket.funding.l2CredentialsAvailable;
  const prepareBlockedReason =
    !walletConnected
      ? "connect_wallet"
      : !polygonReady
        ? "unsupported_chain"
        : !marketTradable
          ? "market_not_tradable"
          : !tokenValid || !priceValid
            ? "missing_token_id"
            : !amountValid
              ? "invalid_amount"
              : !riskDisclosureAccepted
                ? "risk_disclosure_missing"
                : !fundingReady
                  ? ticket.disabledReason
                  : !ticket.readiness.liveTradingEnabled
                    ? "live_trading_disabled"
                    : null;
  const canEditOrder = walletConnected && marketTradable && tokenValid;
  const canPrepare = prepareBlockedReason === null;
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
  const readinessChecks = useMemo(() => {
    return ticket.readiness.checks.map((check) => {
      if (check.id === "wallet_connected") {
        return {
          ...check,
          state: walletConnected ? ("ready" as const) : ("blocked" as const),
          detail: walletConnected
            ? isZh(locale)
              ? "錢包已連接。"
              : "Wallet is connected."
            : disabledReasonLabel("connect_wallet", locale)
        };
      }
      if (check.id === "polygon_chain") {
        return {
          ...check,
          state:
            walletState.status === "disconnected" || walletState.status === "connecting"
              ? ("unavailable" as const)
              : polygonReady
                ? ("ready" as const)
                : ("blocked" as const),
          detail: polygonReady
            ? isZh(locale)
              ? "已在 Polygon。"
              : "Wallet is on Polygon."
            : disabledReasonLabel("unsupported_chain", locale)
        };
      }
      if (check.id === "token_outcome_valid") {
        return {
          ...check,
          state: tokenValid ? ("ready" as const) : ("blocked" as const),
          detail: tokenValid
            ? isZh(locale)
              ? "已選擇真實 CLOB token。"
              : "Selected outcome has a real CLOB token."
            : disabledReasonLabel("missing_token_id", locale)
        };
      }
      if (check.id === "signer_identity_valid") {
        const signedOrPrepared =
          prepareState.status === "ready" || prepareState.status === "signed";
        return {
          ...check,
          state: signedOrPrepared
            ? ("ready" as const)
            : walletConnected
              ? ("unavailable" as const)
              : ("blocked" as const),
          detail: signedOrPrepared
            ? isZh(locale)
              ? "伺服器已驗證 maker/signer 身份。"
              : "Server validated the maker/signer identity."
            : check.detail
        };
      }
      return check;
    });
  }, [
    locale,
    polygonReady,
    prepareState.status,
    ticket.readiness.checks,
    tokenValid,
    walletConnected,
    walletState.status
  ]);

  function resetPreparedState() {
    setPreparedOrder(null);
    setSignedOrder(null);
    setPrepareState({ status: "idle", code: null, message: null });
  }

  async function prepareOrder() {
    if (!canPrepare || !selected?.tokenId || !selected.price || walletState.status !== "connected") {
      setPrepareState({
        status: "blocked",
        code: prepareBlockedReason ?? "invalid_order",
        message: disabledReasonLabel(prepareBlockedReason, locale)
      });
      return;
    }

    setPrepareState({ status: "preparing", code: null, message: null });
    setPreparedOrder(null);
    setSignedOrder(null);

    try {
      const response = await fetch("/api/polymarket/orders/prepare", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          intent: {
            tokenId: selected.tokenId,
            marketId: market.id,
            marketSlug: market.slug,
            outcome: selected.label,
            outcomeId: selected.tokenId,
            side,
            price: selected.price,
            size: amount,
            tickSize: 0.01,
            ownerAddress: walletState.address,
            funderAddress: walletState.address,
            walletChainId: walletState.chainId,
            riskDisclosureAccepted,
            orderType: "GTC"
          }
        })
      });
      const result = (await response.json().catch(() => null)) as
        | PreparedOrderResponse
        | null;

      if (!response.ok || !result || result.status !== "ready") {
        const code = result?.status === "blocked" ? result.code : "prepare_failed";
        setPrepareState({
          status: "blocked",
          code,
          message:
            result?.status === "blocked"
              ? result.message
              : disabledReasonLabel(code, locale)
        });
        return;
      }

      setPreparedOrder(result);
      setPrepareState({
        status: "ready",
        code: null,
        message: isZh(locale) ? "訂單已準備，可由錢包簽署。" : "Order prepared for wallet signing."
      });
    } catch {
      setPrepareState({
        status: "failed",
        code: "prepare_failed",
        message: isZh(locale) ? "訂單準備失敗。" : "Order preparation failed."
      });
    }
  }

  async function signPreparedOrder() {
    if (!preparedOrder || walletState.status !== "connected") {
      return;
    }
    if (!walletClient) {
      setPrepareState({
        status: "blocked",
        code: "wallet_client_unavailable",
        message: disabledReasonLabel("wallet_client_unavailable", locale)
      });
      return;
    }

    try {
      setPrepareState({
        status: "signing",
        code: null,
        message: isZh(locale) ? "等待錢包簽署。" : "Awaiting wallet signature."
      });
      const signTypedData = walletClient.signTypedData as (input: {
        account: EvmAddress;
        domain: Extract<PreparedOrderResponse, { status: "ready" }>["typedData"]["domain"];
        types: Extract<PreparedOrderResponse, { status: "ready" }>["typedData"]["types"];
        primaryType: string;
        message: Extract<PreparedOrderResponse, { status: "ready" }>["typedData"]["message"];
      }) => Promise<`0x${string}`>;
      const signature = await signTypedData({
        account: walletState.address,
        domain: preparedOrder.typedData.domain,
        types: preparedOrder.typedData.types,
        primaryType: preparedOrder.typedData.primaryType,
        message: preparedOrder.typedData.message
      });
      const finalSignature = preparedOrder.sdkSignatureSuffix
        ? `0x${signature.slice(2)}${preparedOrder.sdkSignatureSuffix}`
        : signature;

      setSignedOrder({
        ...preparedOrder.order,
        signature: finalSignature
      });
      setPrepareState({
        status: "signed",
        code: null,
        message: isZh(locale)
          ? "已取得錢包簽署；提交仍保持封鎖。"
          : "Wallet signature captured; submit remains blocked."
      });
    } catch {
      setPrepareState({
        status: "failed",
        code: "wallet_signature_rejected",
        message: isZh(locale) ? "錢包未完成簽署。" : "Wallet signing did not complete."
      });
    }
  }

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
              onClick={() => {
                resetPreparedState();
                setSide(option);
              }}
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
                resetPreparedState();
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
            {isZh(locale) ? "訂單數量" : "Order size"}
          </span>
        </label>
        <input
          className="h-14 min-w-0 flex-1 border-0 bg-transparent text-right text-3xl font-semibold text-[var(--foreground)] outline-none placeholder:text-slate-400"
          placeholder="$0"
          aria-label="Size"
          inputMode="decimal"
          value={amountInput}
          onChange={(event) => {
            resetPreparedState();
            setAmountInput(event.target.value);
          }}
          disabled={!canEditOrder}
        />
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        {amountChips.map((chip) => (
          <button
            key={chip}
            type="button"
            disabled={!canEditOrder}
            onClick={() => {
              resetPreparedState();
              if (side === "BUY") {
                setAmountInput(chip.replace("+$", ""));
                return;
              }
              setAmountInput(chip.replace("%", ""));
            }}
            className="focus-ring inline-flex h-8 min-w-[3.25rem] items-center justify-center rounded-md border border-[var(--border)] px-2 text-xs font-semibold text-[var(--foreground)] hover:bg-[var(--accent)] disabled:cursor-not-allowed disabled:text-[var(--muted-foreground)] disabled:opacity-60"
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

      <label className="mb-4 flex items-start gap-2 rounded-md border border-[var(--border)] bg-[var(--muted)] p-3 text-xs leading-5 text-[var(--foreground)]">
        <input
          type="checkbox"
          className="mt-1 size-4"
          checked={riskDisclosureAccepted}
          onChange={(event) => {
            resetPreparedState();
            setRiskDisclosureAccepted(event.target.checked);
          }}
          disabled={!canEditOrder}
        />
        <span>
          {isZh(locale)
            ? "我明白此步只準備和簽署訂單；V2 仍不會提交真實訂單。"
            : "I understand this only prepares and signs an order; V2 still will not submit a live order."}
        </span>
      </label>

      <div className="mb-4 rounded-md bg-[var(--muted)] px-3 py-1">
        {readinessChecks.map((check) => (
          <ReadinessRow
            key={check.id}
            label={readinessCheckLabel(check.id, check.label, locale)}
            state={check.state}
            value={check.detail}
          />
        ))}
      </div>

      <div className="mb-3 grid gap-2">
        <button
          className="focus-ring inline-flex h-11 items-center justify-center gap-2 rounded-md border border-[var(--border)] bg-[var(--card)] px-3 text-sm font-bold text-[var(--foreground)] hover:bg-[var(--accent)] disabled:cursor-not-allowed disabled:text-[var(--muted-foreground)] disabled:opacity-60"
          disabled={!canPrepare || prepareState.status === "preparing"}
          onClick={() => {
            void prepareOrder();
          }}
          type="button"
        >
          {prepareState.status === "preparing" ? (
            <Loader2 className="size-4 animate-spin" aria-hidden="true" />
          ) : (
            <PenLine className="size-4" aria-hidden="true" />
          )}
          {isZh(locale) ? "準備簽署訂單" : "Prepare signed order"}
        </button>

        <button
          className="focus-ring inline-flex h-11 items-center justify-center gap-2 rounded-md border border-[var(--border)] bg-[var(--card)] px-3 text-sm font-bold text-[var(--foreground)] hover:bg-[var(--accent)] disabled:cursor-not-allowed disabled:text-[var(--muted-foreground)] disabled:opacity-60"
          disabled={!preparedOrder || Boolean(signedOrder) || prepareState.status === "signing"}
          onClick={() => {
            void signPreparedOrder();
          }}
          type="button"
        >
          {prepareState.status === "signing" ? (
            <Loader2 className="size-4 animate-spin" aria-hidden="true" />
          ) : (
            <PenLine className="size-4" aria-hidden="true" />
          )}
          {isZh(locale) ? "用錢包簽署" : "Sign with wallet"}
        </button>
      </div>

      {prepareState.message ? (
        <div
          className={
            prepareState.status === "blocked" || prepareState.status === "failed"
              ? "mb-3 rounded-md border border-[var(--warning)] bg-[color-mix(in_srgb,var(--warning)_10%,white)] p-3 text-xs font-semibold leading-5 text-[var(--foreground)]"
              : "mb-3 rounded-md border border-[var(--border)] bg-[var(--muted)] p-3 text-xs font-semibold leading-5 text-[var(--foreground)]"
          }
        >
          {prepareState.message}
        </div>
      ) : null}

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
        {prepareBlockedReason
          ? disabledReasonLabel(prepareBlockedReason, locale)
          : signedOrder
            ? disabledReasonLabel("signed_submit_adapter_not_configured", locale)
            : unavailable
              ? disabledReasonLabel(clientDisabledReason, locale)
              : isZh(locale)
                ? "錢包、充值及伺服器閘門均通過後才可準備簽署。"
                : "Wallet, funding, and server gates passed; prepare can request browser signing."}
      </p>
    </section>
  );
}
