"use client";

import { useAccount } from "wagmi";
import { getAppKitReadiness, resolveWalletConnectionState } from "@/lib/wallet/appkit";
import { reownProjectId } from "@/lib/wallet/appkit-config";

export function useWalletConnectionState() {
  const account = useAccount();

  return resolveWalletConnectionState({
    readiness: getAppKitReadiness(reownProjectId),
    address: account.address,
    chainId: account.chainId,
    connected: account.isConnected,
    connecting:
      account.status === "connecting" || account.status === "reconnecting"
  });
}
