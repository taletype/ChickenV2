"use client";

import { useEffect } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useWalletConnectionState } from "@/hooks/use-wallet-connection-state";

function shouldSyncWalletAddress(pathname: string | null) {
  if (!pathname) {
    return false;
  }

  return pathname.includes("/portfolio") || /\/polymarket\/[^/]+$/.test(pathname);
}

export function WalletRouteSync() {
  const walletState = useWalletConnectionState();
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (!shouldSyncWalletAddress(pathname)) {
      return;
    }

    const currentAddress = searchParams.get("address");
    const nextAddress =
      walletState.status === "connected" ? walletState.address : null;

    if (currentAddress === nextAddress || (!currentAddress && !nextAddress)) {
      return;
    }

    const nextParams = new URLSearchParams(searchParams.toString());
    if (nextAddress) {
      nextParams.set("address", nextAddress);
    } else {
      nextParams.delete("address");
    }

    const query = nextParams.toString();
    const nextHref = query ? `${pathname}?${query}` : pathname;
    router.replace(nextHref as Parameters<typeof router.replace>[0], {
      scroll: false
    });
  }, [pathname, router, searchParams, walletState.address, walletState.status]);

  return null;
}
