import "server-only";
import type { ApiKeyCreds } from "@polymarket/clob-client-v2";
import { getServerEnv, type ServerEnv } from "@/lib/env/server-env";
import { normalizeEvmAddress, type EvmAddress } from "@/lib/wallet/address";
import {
  DEFAULT_DEPOSIT_WALLET_FACTORY_ADDRESS,
  DEFAULT_DEPOSIT_WALLET_IMPLEMENTATION_ADDRESS,
  DEFAULT_PUSD_ADDRESS
} from "./contracts";

export const LIVE_TOP_UP_REQUIRED_ENV = [
  "RELAYER_URL",
  "BUILDER_API_KEY",
  "BUILDER_SECRET",
  "BUILDER_PASS_PHRASE",
  "CLOB_API_KEY",
  "CLOB_SECRET",
  "CLOB_PASS_PHRASE",
  "CLOB_API_URL",
  "POLYGON_RPC_URL",
  "PUSD_ADDRESS",
  "DEPOSIT_WALLET_FACTORY_ADDRESS",
  "POLYMARKET_LIVE_TOP_UP_ENABLED",
  "POLYMARKET_LIVE_TOP_UP_KILL_SWITCH"
] as const;

type RequiredLiveTopUpEnv = (typeof LIVE_TOP_UP_REQUIRED_ENV)[number];

export type LiveTopUpEnvStatus =
  | {
      status: "ready";
      enabled: true;
      killSwitchActive: false;
      missing: [];
      invalid: [];
      config: LiveTopUpRuntimeConfig;
    }
  | {
      status: "blocked";
      enabled: boolean;
      killSwitchActive: boolean;
      missing: RequiredLiveTopUpEnv[];
      invalid: RequiredLiveTopUpEnv[];
      reason:
        | "disabled"
        | "kill_switch_active"
        | "missing_required_env"
        | "invalid_required_env";
      config: Partial<LiveTopUpRuntimeConfig>;
    };

export type LiveTopUpRuntimeConfig = {
  relayerUrl: string;
  builderApiKey: string;
  builderSecret: string;
  builderPassPhrase: string;
  clobApiKey: string;
  clobSecret: string;
  clobPassPhrase: string;
  clobApiUrl: string;
  polygonRpcUrl: string;
  pusdAddress: EvmAddress;
  depositWalletFactoryAddress: EvmAddress;
  depositWalletImplementationAddress: EvmAddress;
};

function text(value: string | undefined) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

function baseHttpsUrl(value: string | undefined) {
  const trimmed = text(value);
  if (!trimmed) {
    return null;
  }

  try {
    const url = new URL(trimmed);
    if (url.protocol !== "https:" || url.search || url.hash) {
      return null;
    }
    if (url.pathname && url.pathname !== "/") {
      return null;
    }
    return url.origin;
  } catch {
    return null;
  }
}

function url(value: string | undefined) {
  const trimmed = text(value);
  if (!trimmed) {
    return null;
  }

  try {
    return new URL(trimmed).toString().replace(/\/$/, "");
  } catch {
    return null;
  }
}

function addMissing(
  missing: RequiredLiveTopUpEnv[],
  name: RequiredLiveTopUpEnv,
  value: unknown
) {
  if (!value) {
    missing.push(name);
  }
}

export function getLiveTopUpEnvStatus(
  env: ServerEnv = getServerEnv()
): LiveTopUpEnvStatus {
  const relayerUrl = baseHttpsUrl(env.RELAYER_URL);
  const clobApiUrl = url(env.CLOB_API_URL);
  const polygonRpcUrl = url(env.POLYGON_RPC_URL);
  const pusdAddress = normalizeEvmAddress(env.PUSD_ADDRESS) ?? DEFAULT_PUSD_ADDRESS;
  const depositWalletFactoryAddress =
    normalizeEvmAddress(env.DEPOSIT_WALLET_FACTORY_ADDRESS) ??
    DEFAULT_DEPOSIT_WALLET_FACTORY_ADDRESS;
  const depositWalletImplementationAddress =
    normalizeEvmAddress(env.DEPOSIT_WALLET_IMPLEMENTATION_ADDRESS) ??
    DEFAULT_DEPOSIT_WALLET_IMPLEMENTATION_ADDRESS;
  const builderApiKey = text(env.BUILDER_API_KEY);
  const builderSecret = text(env.BUILDER_SECRET);
  const builderPassPhrase = text(env.BUILDER_PASS_PHRASE);
  const clobApiKey = text(env.CLOB_API_KEY);
  const clobSecret = text(env.CLOB_SECRET);
  const clobPassPhrase = text(env.CLOB_PASS_PHRASE);
  const missing: RequiredLiveTopUpEnv[] = [];
  const invalid: RequiredLiveTopUpEnv[] = [];

  addMissing(missing, "RELAYER_URL", relayerUrl);
  addMissing(missing, "BUILDER_API_KEY", builderApiKey);
  addMissing(missing, "BUILDER_SECRET", builderSecret);
  addMissing(missing, "BUILDER_PASS_PHRASE", builderPassPhrase);
  addMissing(missing, "CLOB_API_KEY", clobApiKey);
  addMissing(missing, "CLOB_SECRET", clobSecret);
  addMissing(missing, "CLOB_PASS_PHRASE", clobPassPhrase);
  addMissing(missing, "CLOB_API_URL", clobApiUrl);
  addMissing(missing, "POLYGON_RPC_URL", polygonRpcUrl);
  addMissing(missing, "PUSD_ADDRESS", env.PUSD_ADDRESS);
  addMissing(missing, "DEPOSIT_WALLET_FACTORY_ADDRESS", env.DEPOSIT_WALLET_FACTORY_ADDRESS);

  if (env.RELAYER_URL && !relayerUrl) {
    invalid.push("RELAYER_URL");
  }
  if (env.CLOB_API_URL && !clobApiUrl) {
    invalid.push("CLOB_API_URL");
  }
  if (env.POLYGON_RPC_URL && !polygonRpcUrl) {
    invalid.push("POLYGON_RPC_URL");
  }
  if (env.PUSD_ADDRESS && !normalizeEvmAddress(env.PUSD_ADDRESS)) {
    invalid.push("PUSD_ADDRESS");
  }
  if (
    env.DEPOSIT_WALLET_FACTORY_ADDRESS &&
    !normalizeEvmAddress(env.DEPOSIT_WALLET_FACTORY_ADDRESS)
  ) {
    invalid.push("DEPOSIT_WALLET_FACTORY_ADDRESS");
  }

  const config: Partial<LiveTopUpRuntimeConfig> = {
    relayerUrl: relayerUrl ?? undefined,
    builderApiKey: builderApiKey ?? undefined,
    builderSecret: builderSecret ?? undefined,
    builderPassPhrase: builderPassPhrase ?? undefined,
    clobApiKey: clobApiKey ?? undefined,
    clobSecret: clobSecret ?? undefined,
    clobPassPhrase: clobPassPhrase ?? undefined,
    clobApiUrl: clobApiUrl ?? undefined,
    polygonRpcUrl: polygonRpcUrl ?? undefined,
    pusdAddress,
    depositWalletFactoryAddress,
    depositWalletImplementationAddress
  };

  if (!env.POLYMARKET_LIVE_TOP_UP_ENABLED) {
    return {
      status: "blocked",
      enabled: false,
      killSwitchActive: env.POLYMARKET_LIVE_TOP_UP_KILL_SWITCH,
      missing,
      invalid,
      reason: "disabled",
      config
    };
  }

  if (env.POLYMARKET_LIVE_TOP_UP_KILL_SWITCH) {
    return {
      status: "blocked",
      enabled: true,
      killSwitchActive: true,
      missing,
      invalid,
      reason: "kill_switch_active",
      config
    };
  }

  if (missing.length > 0) {
    return {
      status: "blocked",
      enabled: true,
      killSwitchActive: false,
      missing,
      invalid,
      reason: "missing_required_env",
      config
    };
  }

  if (invalid.length > 0) {
    return {
      status: "blocked",
      enabled: true,
      killSwitchActive: false,
      missing,
      invalid,
      reason: "invalid_required_env",
      config
    };
  }

  return {
    status: "ready",
    enabled: true,
    killSwitchActive: false,
    missing: [],
    invalid: [],
    config: config as LiveTopUpRuntimeConfig
  };
}

export function getDepositWalletAddressConfig(env: ServerEnv = getServerEnv()) {
  const status = getLiveTopUpEnvStatus(env);
  return {
    factoryAddress:
      status.config.depositWalletFactoryAddress ?? DEFAULT_DEPOSIT_WALLET_FACTORY_ADDRESS,
    implementationAddress:
      status.config.depositWalletImplementationAddress ??
      DEFAULT_DEPOSIT_WALLET_IMPLEMENTATION_ADDRESS
  };
}

export function getLiveTopUpClobCredentials(env: ServerEnv = getServerEnv()) {
  const status = getLiveTopUpEnvStatus(env);
  if (
    !status.config.clobApiKey ||
    !status.config.clobSecret ||
    !status.config.clobPassPhrase
  ) {
    return null;
  }

  return {
    key: status.config.clobApiKey,
    secret: status.config.clobSecret,
    passphrase: status.config.clobPassPhrase
  } satisfies ApiKeyCreds;
}

export function assertLiveTopUpMutationAllowed(env: ServerEnv = getServerEnv()) {
  const status = getLiveTopUpEnvStatus(env);
  if (status.status === "ready") {
    return status;
  }

  return status;
}
