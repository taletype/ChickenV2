"use client";

import type { AppKitNetwork } from "@reown/appkit/networks";
import { polygon } from "@reown/appkit/networks";
import { WagmiAdapter } from "@reown/appkit-adapter-wagmi";
import { createConfig, http } from "wagmi";
import { injected } from "wagmi/connectors";
import { getPublicEnv } from "@/lib/env/public-env";

export const reownProjectId =
  getPublicEnv().NEXT_PUBLIC_REOWN_APPKIT_PROJECT_ID ?? "";

export const defaultWalletNetwork = polygon satisfies AppKitNetwork;
export const appKitNetworks = [
  defaultWalletNetwork
] as [AppKitNetwork, ...AppKitNetwork[]];

export const wagmiAdapter = reownProjectId
  ? new WagmiAdapter({
      ssr: true,
      projectId: reownProjectId,
      networks: appKitNetworks,
      connectors: [injected({ shimDisconnect: true })]
    })
  : null;

export const wagmiConfig =
  wagmiAdapter?.wagmiConfig ??
  createConfig({
    ssr: true,
    chains: [polygon],
    connectors: [injected({ shimDisconnect: true })],
    transports: {
      [polygon.id]: http()
    }
  });
