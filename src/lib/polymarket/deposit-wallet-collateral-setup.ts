import { getCollateralSetupConfig } from "./collateral-setup";

export function resolveDepositWalletCollateralSetup() {
  const config = getCollateralSetupConfig();

  if (!config.enabled) {
    return {
      status: "unsupported" as const,
      reason: config.reason
    };
  }

  return {
    status: "ready" as const,
    rpcUrl: config.rpcUrl
  };
}
