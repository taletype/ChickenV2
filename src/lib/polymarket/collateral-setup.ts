import { getServerEnv } from "@/lib/env/server-env";

export type CollateralSetupConfig =
  | {
      enabled: true;
      rpcUrl: string;
    }
  | {
      enabled: false;
      reason: "disabled" | "missing_rpc_url";
    };

export function getCollateralSetupConfig(): CollateralSetupConfig {
  const env = getServerEnv();

  if (!env.POLYMARKET_COLLATERAL_SETUP_ENABLED) {
    return { enabled: false, reason: "disabled" };
  }

  if (!env.POLYGON_RPC_URL) {
    return { enabled: false, reason: "missing_rpc_url" };
  }

  return {
    enabled: true,
    rpcUrl: env.POLYGON_RPC_URL
  };
}
