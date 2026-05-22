"use client";

import {
  AlertTriangle,
  Copy,
  ExternalLink,
  LogOut,
  PlugZap,
  UserRound,
  Wallet,
  X
} from "lucide-react";
import { useMemo, useState } from "react";
import { useDisconnect, useSwitchChain } from "wagmi";
import { useWalletConnectionState } from "@/hooks/use-wallet-connection-state";
import {
  SUPPORTED_WALLET_CHAIN_ID,
  SUPPORTED_WALLET_CHAIN_NAME
} from "@/lib/wallet/appkit";
import { useAppKitController } from "@/lib/wallet/appkit-context";

function statusText(status: ReturnType<typeof useWalletConnectionState>["status"]) {
  if (status === "connected") {
    return SUPPORTED_WALLET_CHAIN_NAME;
  }
  if (status === "unsupported_chain") {
    return "Wrong chain";
  }
  if (status === "connecting") {
    return "Connecting";
  }
  if (status === "unconfigured") {
    return "Wallet unavailable";
  }
  return "Wallet";
}

export function WalletConnectButton({ locale = "zh" }: { locale?: string }) {
  return <WalletConnectButtonContent locale={locale} />;
}

export function WalletConnectButtonContent({ locale = "zh" }: { locale?: string }) {
  const walletState = useWalletConnectionState();
  const appKit = useAppKitController();
  const { disconnect } = useDisconnect();
  const { chains, isPending, switchChain } = useSwitchChain();
  const [accountOpen, setAccountOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const isZh = locale.toLowerCase().startsWith("zh");
  const canSwitchToPolygon = useMemo(
    () => chains.some((chain) => chain.id === SUPPORTED_WALLET_CHAIN_ID),
    [chains]
  );
  const connected =
    walletState.status === "connected" ||
    walletState.status === "unsupported_chain";

  if (!connected) {
    return (
      <button
        type="button"
        disabled={!appKit.ready}
        onClick={() => void appKit.open()}
        className="focus-ring inline-flex h-9 shrink-0 items-center justify-center gap-2 rounded-md bg-[var(--primary)] px-3 py-2 text-sm font-semibold whitespace-nowrap text-white shadow-sm transition-colors hover:bg-[color-mix(in_srgb,var(--primary)_90%,black)] disabled:cursor-not-allowed disabled:bg-slate-300 md:px-4"
        title={
          appKit.disabledReason === "missing_project_id"
            ? "Wallet connection is unavailable until Reown AppKit is configured."
            : undefined
        }
      >
        <Wallet className="size-4" aria-hidden="true" />
        {walletState.status === "connecting" ? "Connecting" : "Connect"}
      </button>
    );
  }

  async function copyAddress() {
    if (
      walletState.status !== "connected" &&
      walletState.status !== "unsupported_chain"
    ) {
      return;
    }
    if (!navigator.clipboard) {
      return;
    }

    await navigator.clipboard.writeText(walletState.address);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1200);
  }

  return (
    <div className="flex min-w-0 items-center gap-1.5">
      <button
        type="button"
        onClick={() => setAccountOpen(true)}
        className={
          walletState.status === "unsupported_chain"
            ? "focus-ring hidden min-w-0 items-center gap-1.5 rounded-md border border-[var(--warning)] bg-[color-mix(in_srgb,var(--warning)_10%,white)] px-2.5 py-1.5 text-xs font-semibold text-[var(--foreground)] sm:flex"
            : "focus-ring hidden min-w-0 items-center gap-1.5 rounded-md border border-[var(--border)] bg-[var(--card)] px-2.5 py-1.5 text-xs font-semibold text-[var(--foreground)] transition-colors hover:bg-[var(--accent)] sm:flex"
        }
      >
        {walletState.status === "unsupported_chain" ? (
          <AlertTriangle className="size-3.5 shrink-0 text-[var(--warning)]" aria-hidden="true" />
        ) : (
          <PlugZap className="size-3.5 shrink-0 text-[var(--yes)]" aria-hidden="true" />
        )}
        <span className="shrink-0 text-[var(--muted-foreground)]">
          {statusText(walletState.status)}
        </span>
        <span className="min-w-0 truncate">{walletState.label}</span>
      </button>

      {walletState.status === "unsupported_chain" ? (
        <button
          type="button"
          disabled={!canSwitchToPolygon || isPending}
          onClick={() => switchChain({ chainId: SUPPORTED_WALLET_CHAIN_ID })}
          className="focus-ring inline-flex h-9 shrink-0 items-center justify-center rounded-md border border-[var(--border)] px-3 text-xs font-bold text-[var(--foreground)] disabled:cursor-not-allowed disabled:opacity-50"
        >
          Polygon
        </button>
      ) : null}

      <button
        type="button"
        onClick={() => void disconnect()}
        className="focus-ring inline-flex size-9 shrink-0 items-center justify-center rounded-md border border-[var(--border)] text-[var(--muted-foreground)] transition-colors hover:bg-[var(--accent)] hover:text-[var(--foreground)]"
        aria-label="Disconnect wallet"
      >
        <LogOut className="size-4" aria-hidden="true" />
      </button>

      {accountOpen ? (
        <div className="fixed inset-0 z-50 grid place-items-end bg-black/25 px-3 pb-3 pt-16 sm:place-items-center sm:p-6">
          <div className="w-full max-w-md rounded-lg border border-[var(--border)] bg-[var(--card)] p-4 shadow-[var(--panel-shadow)]">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="grid size-11 place-items-center rounded-full bg-[var(--muted)] text-[var(--foreground)]">
                  <UserRound className="size-5" aria-hidden="true" />
                </div>
                <div>
                  <h2 className="text-base font-semibold text-[var(--foreground)]">
                    {isZh ? "錢包帳戶" : "Wallet account"}
                  </h2>
                  <p className="text-sm text-[var(--muted-foreground)]">
                    {statusText(walletState.status)}
                  </p>
                </div>
              </div>
              <button
                type="button"
                className="focus-ring inline-flex size-9 items-center justify-center rounded-sm text-[var(--muted-foreground)] hover:bg-[var(--accent)] hover:text-[var(--foreground)]"
                aria-label={isZh ? "關閉帳戶" : "Close account"}
                onClick={() => setAccountOpen(false)}
              >
                <X className="size-4" aria-hidden="true" />
              </button>
            </div>

            <div className="mt-4 grid gap-3">
              <div className="rounded-md border border-[var(--border)] bg-[var(--muted)] p-3">
                <div className="text-xs font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">
                  {isZh ? "地址" : "Address"}
                </div>
                <div className="mt-1 break-all font-mono text-xs font-semibold text-[var(--foreground)]">
                  {walletState.address}
                </div>
              </div>

              {walletState.status === "unsupported_chain" ? (
                <div className="rounded-md border border-[var(--warning)] bg-[color-mix(in_srgb,var(--warning)_10%,white)] p-3 text-sm font-semibold text-[var(--foreground)]">
                  {isZh
                    ? `請切換至 ${SUPPORTED_WALLET_CHAIN_NAME} 後再讀取真實帳戶資料。`
                    : `Switch to ${SUPPORTED_WALLET_CHAIN_NAME} before loading real account data.`}
                </div>
              ) : null}

              <div className="grid gap-2 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() => {
                    void copyAddress();
                  }}
                  className="focus-ring inline-flex h-10 items-center justify-center gap-2 rounded-md border border-[var(--border)] px-3 text-sm font-semibold text-[var(--foreground)] hover:bg-[var(--accent)]"
                >
                  <Copy className="size-4" aria-hidden="true" />
                  {copied ? (isZh ? "已複製" : "Copied") : (isZh ? "複製地址" : "Copy address")}
                </button>
                <a
                  href={`/${locale}/portfolio`}
                  className="focus-ring inline-flex h-10 items-center justify-center gap-2 rounded-md bg-[var(--primary)] px-3 text-sm font-semibold text-white"
                >
                  <ExternalLink className="size-4" aria-hidden="true" />
                  {isZh ? "查看投資組合" : "View portfolio"}
                </a>
              </div>

              <p className="text-xs leading-5 text-[var(--muted-foreground)]">
                {isZh
                  ? "交易與 top-up 仍由 V2 伺服器端 guard 控制；此視窗不提交訂單或授權。"
                  : "Trading and top-up remain controlled by V2 server-side guards; this modal does not submit orders or approvals."}
              </p>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
