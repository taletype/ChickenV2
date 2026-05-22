"use client";

import {
  ArrowUpRight,
  Ban,
  CheckCircle2,
  CircleDollarSign,
  Copy,
  QrCode,
  RotateCw,
  ShieldCheck,
  TriangleAlert
} from "lucide-react";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import type { DepositWalletCall } from "@polymarket/builder-relayer-client";
import { useWalletClient } from "wagmi";
import { useWalletConnectionState } from "@/hooks/use-wallet-connection-state";
import {
  SUPPORTED_WALLET_CHAIN_NAME,
  type WalletConnectionViewState
} from "@/lib/wallet/appkit";
import type { EvmAddress } from "@/lib/wallet/address";

type FundingPanelViewModel = Awaited<ReturnType<
  typeof import("@/features/prediction/funding/adapter").buildFundingPanelViewModel
>>;
type LiveTopUpFundingSnapshot = FundingPanelViewModel["liveTopUp"];

type DepositWalletApprovalPlanResponse =
  | {
      status: "ready";
      ownerAddress: EvmAddress;
      depositWalletAddress: EvmAddress;
      amountBaseUnits: string;
      spenderAddress: EvmAddress;
      tokenAddress: EvmAddress;
      nonce: string;
      deadline: string;
      calls: DepositWalletCall[];
      typedData: {
        domain: {
          name: "DepositWallet";
          version: "1";
          chainId: 137;
          verifyingContract: EvmAddress;
        };
        types: {
          Call: Array<{ name: "target" | "value" | "data"; type: string }>;
          Batch: Array<{ name: "wallet" | "nonce" | "deadline" | "calls"; type: string }>;
        };
        primaryType: "Batch";
        message: {
          wallet: EvmAddress;
          nonce: string;
          deadline: string;
          calls: DepositWalletCall[];
        };
      };
    }
  | {
      status: "blocked";
      code: string;
    };

type DepositWalletApprovalSubmitResponse =
  | {
      status: "submitted";
      transactionID: string;
      state: string;
    }
  | {
      status: "blocked";
      code: string;
    };

type ApprovalSubmissionState =
  | { status: "idle" }
  | { status: "planning" }
  | { status: "signing" }
  | { status: "submitting" }
  | { status: "submitted"; transactionID: string; state: string }
  | { status: "blocked"; code: string };
type ReadyDepositWalletApprovalPlan = Extract<
  DepositWalletApprovalPlanResponse,
  { status: "ready" }
>;

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

function tradeReadyCollateralValue(
  clob: LiveTopUpFundingSnapshot["balances"]["clob"],
  locale?: string
) {
  if (clob.status !== "available") {
    return clob.reason;
  }
  if (!clob.balanceReady || !clob.allowanceReady) {
    return isZh(locale) ? "尚未可交易" : "Not trade-ready";
  }
  return formatPusd(String(Math.min(clob.balance, clob.allowance)));
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
  walletState: WalletConnectionViewState,
  signerReady: boolean,
  submission: ApprovalSubmissionState,
  locale?: string
) {
  if (submission.status === "planning") {
    return isZh(locale) ? "正在準備精確授權" : "Preparing exact approval";
  }
  if (submission.status === "signing") {
    return isZh(locale) ? "等待錢包簽署" : "Awaiting wallet signature";
  }
  if (submission.status === "submitting") {
    return isZh(locale) ? "正在提交授權" : "Submitting approval";
  }
  if (submission.status === "submitted") {
    return isZh(locale) ? "授權已提交" : "Approval submitted";
  }
  if (submission.status === "blocked") {
    return isZh(locale) ? `授權被阻止：${submission.code}` : `Approval blocked: ${submission.code}`;
  }
  if (liveTopUp.env.status !== "ready") {
    return isZh(locale)
      ? "提交已停用：live top-up 閘門未通過"
      : "Submit disabled: live top-up gates are closed";
  }
  if (walletState.status !== "connected") {
    return isZh(locale) ? "請先連接錢包" : "Connect wallet to approve";
  }
  if (liveTopUp.readiness.step === "approval_required") {
    if (liveTopUp.approvalPreview.status !== "ready") {
      return isZh(locale) ? "授權預覽不可用" : "Approval preview unavailable";
    }
    if (!signerReady) {
      return isZh(locale) ? "錢包簽署器不可用" : "Wallet signer unavailable";
    }
    return isZh(locale) ? "簽署精確授權" : "Sign exact approval";
  }
  if (liveTopUp.readiness.step === "ready") {
    return isZh(locale) ? "授權已同步" : "Approval already synced";
  }
  if (!liveTopUp.readiness.topUpReady) {
    return isZh(locale)
      ? "提交已停用：等待真實充值狀態"
      : "Submit disabled: waiting for real top-up readiness";
  }
  return isZh(locale)
    ? "提交已停用：等待授權狀態"
    : "Submit disabled: waiting for approval state";
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
  const { data: walletClient } = useWalletClient();
  const [approvalSubmission, setApprovalSubmission] =
    useState<ApprovalSubmissionState>({ status: "idle" });
  const method = funding.methods[0] ?? null;
  const depositWallet =
    liveTopUp.depositWallet.status === "available" ? liveTopUp.depositWallet : null;
  const depositWalletAddress = depositWallet?.depositWalletAddress ?? null;
  const depositPusd = liveTopUp.balances.depositWalletPusd;
  const connectedPusd = liveTopUp.balances.connectedWalletPusd;
  const clob = liveTopUp.balances.clob;
  const [copied, setCopied] = useState(false);
  const approvalPreview = liveTopUp.approvalPreview;
  const approvalPending =
    approvalSubmission.status === "planning" ||
    approvalSubmission.status === "signing" ||
    approvalSubmission.status === "submitting";
  const canSubmitApproval =
    liveTopUp.env.status === "ready" &&
    liveTopUp.readiness.step === "approval_required" &&
    approvalPreview.status === "ready" &&
    walletState.status === "connected" &&
    Boolean(walletClient) &&
    !approvalPending;

  async function submitExactApproval() {
    if (
      !canSubmitApproval ||
      walletState.status !== "connected" ||
      approvalPreview.status !== "ready" ||
      !walletClient
    ) {
      return;
    }

    try {
      setApprovalSubmission({ status: "planning" });
      const planResponse = await fetch("/api/polymarket/deposit-wallet/approval-plan", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          address: walletState.address,
          amountBaseUnits: approvalPreview.amountBaseUnits,
          spenderAddress: approvalPreview.spenderAddress
        })
      });
      const plan = (await planResponse.json().catch(() => null)) as
        | DepositWalletApprovalPlanResponse
        | null;

      if (!planResponse.ok || !plan || plan.status !== "ready") {
        setApprovalSubmission({
          status: "blocked",
          code: plan?.status === "blocked" ? plan.code : "approval_plan_unavailable"
        });
        return;
      }
      const readyPlan: ReadyDepositWalletApprovalPlan = plan;

      setApprovalSubmission({ status: "signing" });
      const signTypedData = walletClient.signTypedData as (input: {
        account: EvmAddress;
        domain: ReadyDepositWalletApprovalPlan["typedData"]["domain"];
        types: ReadyDepositWalletApprovalPlan["typedData"]["types"];
        primaryType: "Batch";
        message: ReadyDepositWalletApprovalPlan["typedData"]["message"];
      }) => Promise<`0x${string}`>;
      const signature = await signTypedData({
        account: walletState.address,
        domain: readyPlan.typedData.domain,
        types: readyPlan.typedData.types,
        primaryType: readyPlan.typedData.primaryType,
        message: readyPlan.typedData.message
      });

      setApprovalSubmission({ status: "submitting" });
      const submitResponse = await fetch(
        "/api/polymarket/deposit-wallet/approval-submit",
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            ownerAddress: readyPlan.ownerAddress,
            depositWalletAddress: readyPlan.depositWalletAddress,
            nonce: readyPlan.nonce,
            deadline: readyPlan.deadline,
            signature,
            calls: readyPlan.calls,
            amountBaseUnits: readyPlan.amountBaseUnits,
            spenderAddress: readyPlan.spenderAddress
          })
        }
      );
      const result = (await submitResponse.json().catch(() => null)) as
        | DepositWalletApprovalSubmitResponse
        | null;

      if (!submitResponse.ok || result?.status !== "submitted") {
        setApprovalSubmission({
          status: "blocked",
          code: result?.status === "blocked" ? result.code : "approval_submit_failed"
        });
        return;
      }

      setApprovalSubmission({
        status: "submitted",
        transactionID: result.transactionID,
        state: result.state
      });
    } catch (error) {
      setApprovalSubmission({
        status: "blocked",
        code: error instanceof Error ? error.message : "approval_submit_failed"
      });
    }
  }

  return (
    <section className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-4 shadow-[var(--panel-shadow)]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-[var(--foreground)]">
            {isZh(locale) ? "資金" : "Funding"}
          </h2>
          <p className="mt-1 text-xs font-semibold text-[var(--muted-foreground)]">
            {isZh(locale) ? "USDC / Polygon，只顯示真實或不可用狀態。" : "USDC on Polygon, real or unavailable states only."}
          </p>
        </div>
        <CircleDollarSign className="size-5 text-[var(--primary)]" aria-hidden="true" />
      </div>

      <div className="mt-4 grid gap-2">
        <FundingStatusCard
          icon={<ShieldCheck className="size-4" aria-hidden="true" />}
          label={isZh(locale) ? "錢包狀態" : "Wallet state"}
          value={walletStatusLabel(walletState, locale)}
          tone={walletState.status === "connected" ? "ready" : walletState.status === "unsupported_chain" ? "warning" : "blocked"}
        />
        <FundingStatusCard
          icon={<CheckCircle2 className="size-4" aria-hidden="true" />}
          label={isZh(locale) ? "充值準備狀態" : "Top-up readiness"}
          value={readinessLabel(liveTopUp.readiness.step, locale)}
          tone={liveTopUp.readiness.topUpReady ? "ready" : "warning"}
        />
      </div>

      <div className="mt-3 rounded-lg border border-[var(--border)] bg-[var(--background)] p-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="text-xs font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">
              {isZh(locale) ? "Transfer Funds" : "Transfer Funds"}
            </div>
            <p className="mt-1 text-sm font-semibold text-[var(--foreground)]">
              {isZh(locale)
                ? "複製 Deposit Wallet 或使用掃描式面板核對地址。"
                : "Copy the deposit wallet or use the scan-style panel to verify the address."}
            </p>
            <p className="mt-2 break-all text-xs font-bold text-[var(--muted-foreground)]">
              {depositWalletAddress ??
                (isZh(locale)
                  ? "未取得真實錢包地址前不可用"
                  : "Unavailable until a real wallet address is known")}
            </p>
          </div>
          <div className="grid size-20 shrink-0 place-items-center rounded-lg border border-[var(--border)] bg-[var(--muted)]">
            <span className="grid size-12 place-items-center rounded-md bg-[var(--background)] text-[var(--foreground)] shadow-sm">
              <QrCode className="size-7" aria-hidden="true" />
            </span>
          </div>
        </div>

        <div className="mt-3 grid grid-cols-2 gap-2">
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
            className="focus-ring inline-flex h-9 items-center justify-center gap-2 rounded-md border border-[var(--border)] px-3 text-xs font-bold text-[var(--foreground)] disabled:cursor-not-allowed disabled:opacity-50"
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
            className="focus-ring inline-flex h-9 items-center justify-center gap-2 rounded-md border border-[var(--border)] px-3 text-xs font-bold text-[var(--foreground)] disabled:cursor-not-allowed disabled:text-[var(--muted-foreground)] disabled:opacity-50"
          >
            <RotateCw className="size-4" aria-hidden="true" />
            {isZh(locale) ? "同步" : "Sync"}
          </button>
        </div>
      </div>

      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        <FundingStatusCard
          label={isZh(locale) ? "Deposit Wallet 狀態" : "Deposit wallet status"}
          value={deployedStatusLabel(liveTopUp.depositWallet, locale)}
          tone={liveTopUp.depositWallet.status === "available" ? "ready" : "blocked"}
        />
        <FundingStatusCard
          label={isZh(locale) ? "已連接錢包資金（pUSD）" : "Connected wallet funds (pUSD)"}
          value={
            connectedPusd.status === "available"
              ? formatPusd(connectedPusd.formatted)
              : connectedPusd.reason
          }
          tone={connectedPusd.status === "available" ? "ready" : "blocked"}
        />
        <FundingStatusCard
          label={isZh(locale) ? "Deposit Wallet 資金（pUSD）" : "Deposit wallet funds (pUSD)"}
          value={
            depositPusd.status === "available" ? formatPusd(depositPusd.formatted) : depositPusd.reason
          }
          tone={depositPusd.status === "available" ? "ready" : "blocked"}
        />
        <FundingStatusCard
          label={isZh(locale) ? "CLOB 餘額" : "CLOB balance"}
          value={
            clob.status === "available"
              ? formatPusd(String(clob.balance))
              : clob.reason
          }
          tone={clob.status === "available" && clob.balanceReady ? "ready" : "blocked"}
        />
        <FundingStatusCard
          label={isZh(locale) ? "CLOB 授權" : "CLOB allowance"}
          value={
            clob.status === "available"
              ? formatPusd(String(clob.allowance))
              : clob.reason
          }
          tone={clob.status === "available" && clob.allowanceReady ? "ready" : "blocked"}
        />
        <FundingStatusCard
          label={isZh(locale) ? "可用交易抵押品" : "Spendable trade-ready collateral"}
          value={tradeReadyCollateralValue(clob, locale)}
          tone={liveTopUp.readiness.stateModel.spendableCollateralReady ? "ready" : "blocked"}
        />
      </div>

      <div className="mt-3 rounded-lg border border-[var(--border)] p-3">
        <div className="text-xs font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">
          {isZh(locale) ? "Readiness checklist" : "Readiness checklist"}
        </div>
        <div className="mt-2 grid gap-2">
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
      </div>

      <div className="mt-3 rounded-lg border border-[var(--border)] p-3">
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
        disabled={!canSubmitApproval}
        onClick={() => {
          void submitExactApproval();
        }}
        className={
          canSubmitApproval
            ? "focus-ring mt-3 flex h-11 w-full items-center justify-center gap-2 rounded-md bg-[var(--primary)] px-4 text-sm font-bold text-white shadow-sm"
            : "mt-3 flex h-11 w-full cursor-not-allowed items-center justify-center gap-2 rounded-md border border-[var(--border)] bg-[var(--card)] px-4 text-sm font-bold text-[var(--muted-foreground)]"
        }
      >
        <Ban className="size-4" aria-hidden="true" />
        {approvalSubmitLabel(
          liveTopUp,
          walletState,
          Boolean(walletClient),
          approvalSubmission,
          locale
        )}
      </button>

      {method ? (
        <a
          href={method.href}
          target="_blank"
          rel="noreferrer"
          className="focus-ring mt-3 flex h-11 items-center justify-center gap-2 rounded-md border border-[var(--border)] bg-[var(--background)] px-4 text-sm font-bold text-[var(--foreground)] shadow-sm"
        >
          {isZh(locale) ? "前往官方充值頁" : "Open official funding site"}
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

function FundingStatusCard({
  icon,
  label,
  value,
  tone
}: {
  icon?: ReactNode;
  label: string;
  value: string;
  tone: "ready" | "warning" | "blocked";
}) {
  return (
    <div className="min-h-[82px] rounded-lg border border-[var(--border)] bg-[var(--muted)] p-3">
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
          {icon ?? <FundingToneIcon tone={tone} />}
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
          <FundingToneIcon tone={tone} />
        </span>
        <div className="min-w-0 break-words text-xs font-bold leading-5 text-[var(--foreground)]">
          {value}
        </div>
      </div>
    </div>
  );
}

function FundingToneIcon({ tone }: { tone: "ready" | "warning" | "blocked" }) {
  if (tone === "ready") {
    return <CheckCircle2 className="size-3.5" aria-hidden="true" />;
  }
  if (tone === "warning") {
    return <TriangleAlert className="size-3.5" aria-hidden="true" />;
  }
  return <Ban className="size-3.5" aria-hidden="true" />;
}
