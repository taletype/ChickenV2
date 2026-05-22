"use client";

import { AlertTriangle, LogOut, PlugZap, Wallet } from "lucide-react";
import { useMemo } from "react";
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

export function WalletConnectButton() {
  const walletState = useWalletConnectionState();
  const appKit = useAppKitController();
  const { disconnect } = useDisconnect();
  const { chains, isPending, switchChain } = useSwitchChain();
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

  return (
    <div className="flex min-w-0 items-center gap-1.5">
      <div
        className={
          walletState.status === "unsupported_chain"
            ? "hidden min-w-0 items-center gap-1.5 rounded-md border border-[var(--warning)] bg-[color-mix(in_srgb,var(--warning)_10%,white)] px-2.5 py-1.5 text-xs font-semibold text-[var(--foreground)] sm:flex"
            : "hidden min-w-0 items-center gap-1.5 rounded-md border border-[var(--border)] bg-[var(--card)] px-2.5 py-1.5 text-xs font-semibold text-[var(--foreground)] sm:flex"
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
      </div>

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
    </div>
  );
}
