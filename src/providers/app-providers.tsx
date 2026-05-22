"use client";

import type { AppKit } from "@reown/appkit";
import { createAppKit } from "@reown/appkit/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { WagmiProvider } from "wagmi";
import { getPublicEnv } from "@/lib/env/public-env";
import {
  AppKitControllerContext,
  defaultAppKitController,
  type AppKitController,
  type AppKitDisabledReason
} from "@/lib/wallet/appkit-context";
import {
  appKitNetworks,
  defaultWalletNetwork,
  reownProjectId,
  wagmiAdapter,
  wagmiConfig
} from "@/lib/wallet/appkit-config";

let appKitInstance: AppKit | null = null;
let appKitInitializationAttempted = false;
let appKitDisabledReason: AppKitDisabledReason = null;

function initializeAppKit(appName: string): {
  disabledReason: AppKitDisabledReason;
  instance: AppKit | null;
} {
  if (appKitInstance || appKitInitializationAttempted) {
    return {
      disabledReason: appKitInstance ? null : appKitDisabledReason,
      instance: appKitInstance
    };
  }

  appKitInitializationAttempted = true;

  if (!reownProjectId || !wagmiAdapter) {
    appKitDisabledReason = "missing_project_id";
    return { disabledReason: "missing_project_id", instance: null };
  }

  try {
    appKitInstance = createAppKit({
      projectId: reownProjectId,
      adapters: [wagmiAdapter],
      networks: appKitNetworks,
      defaultNetwork: defaultWalletNetwork,
      defaultAccountTypes: { eip155: "eoa" },
      metadata: {
        name: appName,
        description: "Chicken Dinner prediction market wallet connection.",
        url: window.location.origin,
        icons: []
      },
      themeMode: "light",
      themeVariables: {
        "--w3m-font-family": "var(--font-sans)",
        "--w3m-border-radius-master": "4px",
        "--w3m-accent": "var(--primary)"
      },
      features: {
        analytics: false,
        swaps: false,
        onramp: false,
        receive: false,
        send: false,
        history: false,
        pay: false,
        headless: false
      }
    });
    appKitDisabledReason = null;

    return { disabledReason: null, instance: appKitInstance };
  } catch {
    appKitDisabledReason = "initialization_failed";
    return { disabledReason: "initialization_failed", instance: null };
  }
}

export function AppProviders({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 20_000,
            retry: 1,
            refetchOnWindowFocus: false
          }
        }
      })
  );
  const [appKitState, setAppKitState] = useState<{
    disabledReason: AppKitDisabledReason;
    instance: AppKit | null;
  }>({
    disabledReason: null,
    instance: null
  });
  const appName = getPublicEnv().NEXT_PUBLIC_APP_NAME;

  useEffect(() => {
    let active = true;
    queueMicrotask(() => {
      if (active) {
        setAppKitState(initializeAppKit(appName));
      }
    });

    return () => {
      active = false;
    };
  }, [appName]);

  const appKitController = useMemo<AppKitController>(() => {
    const instance = appKitState.instance;
    if (!instance) {
      return {
        ...defaultAppKitController,
        disabledReason: appKitState.disabledReason
      };
    }

    return {
      ready: true,
      disabledReason: null,
      open: async (options) => {
        await instance.open(options);
      },
      close: async () => {
        await instance.close();
      }
    };
  }, [appKitState.disabledReason, appKitState.instance]);

  return (
    <WagmiProvider config={wagmiConfig} reconnectOnMount>
      <QueryClientProvider client={queryClient}>
        <AppKitControllerContext value={appKitController}>
          {children}
        </AppKitControllerContext>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
