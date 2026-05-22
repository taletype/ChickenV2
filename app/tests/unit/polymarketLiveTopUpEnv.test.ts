import { describe, expect, it } from "vitest";
import type { ServerEnv } from "@/lib/env/server-env";
import { getLiveTopUpEnvStatus } from "@/lib/polymarket/live-topup-env";
import { buildLiveTopUpFundingSnapshot } from "@/lib/polymarket/live-topup-status";

function env(overrides: Partial<ServerEnv> = {}): ServerEnv {
  return {
    POLYMARKET_GAMMA_API_BASE_URL: "https://gamma-api.polymarket.com",
    POLYMARKET_CLOB_API_BASE_URL: "https://clob.polymarket.com",
    POLYMARKET_DATA_API_BASE_URL: "https://data-api.polymarket.com",
    POLYMARKET_MARKET_CACHE_TTL_MS: 60_000,
    POLYMARKET_PUBLIC_LIVE_ENABLED: false,
    POLYMARKET_LIVE_SUBMIT_ENABLED: false,
    POLYMARKET_LIVE_TRADING_KILL_SWITCH: true,
    POLYMARKET_DRY_RUN_ENABLED: false,
    POLYMARKET_BUILDER_CODE: undefined,
    POLYMARKET_OPERATOR_CONFIRM_LIVE_TRADING: undefined,
    POLYMARKET_REQUIRE_L2_CREDENTIALS: true,
    POLYMARKET_REQUIRE_BUILDER_CODE: true,
    POLYMARKET_CHAIN_ID: 137,
    POLYMARKET_MAX_ORDER_NOTIONAL_USD: 10,
    POLYMARKET_SIGNER_HEALTH_STATUS: "ok",
    POLYMARKET_OFFICIAL_FUNDING_URL: "https://polymarket.com/portfolio",
    POLYMARKET_COLLATERAL_SETUP_ENABLED: false,
    POLYMARKET_LIVE_TOP_UP_ENABLED: false,
    POLYMARKET_LIVE_TOP_UP_KILL_SWITCH: false,
    RELAYER_URL: undefined,
    BUILDER_API_KEY: undefined,
    BUILDER_SECRET: undefined,
    BUILDER_PASS_PHRASE: undefined,
    CLOB_API_KEY: undefined,
    CLOB_SECRET: undefined,
    CLOB_PASS_PHRASE: undefined,
    CLOB_API_URL: undefined,
    POLYMARKET_CLOB_API_KEY: undefined,
    POLYMARKET_CLOB_API_SECRET: undefined,
    POLYMARKET_CLOB_API_PASSPHRASE: undefined,
    POLYGON_RPC_URL: undefined,
    PUSD_ADDRESS: undefined,
    DEPOSIT_WALLET_FACTORY_ADDRESS: undefined,
    DEPOSIT_WALLET_IMPLEMENTATION_ADDRESS: undefined,
    ...overrides
  };
}

const address = "0x0000000000000000000000000000000000000001";

describe("live top-up env validation", () => {
  it("fails closed when the live top-up flag is absent", () => {
    const status = getLiveTopUpEnvStatus(env());

    expect(status.status).toBe("blocked");
    if (status.status === "blocked") {
      expect(status.reason).toBe("disabled");
    }
  });

  it("keeps live top-up blocked when required env is missing", () => {
    const status = getLiveTopUpEnvStatus(
      env({ POLYMARKET_LIVE_TOP_UP_ENABLED: true })
    );

    expect(status.status).toBe("blocked");
    if (status.status === "blocked") {
      expect(status.reason).toBe("missing_required_env");
      expect(status.missing).toContain("RELAYER_URL");
    }
  });

  it("honors the kill switch even with complete credentials", () => {
    const status = getLiveTopUpEnvStatus(
      env({
        POLYMARKET_LIVE_TOP_UP_ENABLED: true,
        POLYMARKET_LIVE_TOP_UP_KILL_SWITCH: true,
        RELAYER_URL: "https://relayer-v2.polymarket.com",
        BUILDER_API_KEY: "builder",
        BUILDER_SECRET: "secret",
        BUILDER_PASS_PHRASE: "pass",
        CLOB_API_KEY: "clob",
        CLOB_SECRET: "clob-secret",
        CLOB_PASS_PHRASE: "clob-pass",
        CLOB_API_URL: "https://clob.polymarket.com",
        POLYGON_RPC_URL: "https://polygon-rpc.example",
        PUSD_ADDRESS: address,
        DEPOSIT_WALLET_FACTORY_ADDRESS: address
      })
    );

    expect(status.status).toBe("blocked");
    if (status.status === "blocked") {
      expect(status.reason).toBe("kill_switch_active");
    }
  });

  it("reports ready only when the full live top-up shape passes", () => {
    const status = getLiveTopUpEnvStatus(
      env({
        POLYMARKET_LIVE_TOP_UP_ENABLED: true,
        RELAYER_URL: "https://relayer-v2.polymarket.com",
        BUILDER_API_KEY: "builder",
        BUILDER_SECRET: "secret",
        BUILDER_PASS_PHRASE: "pass",
        CLOB_API_KEY: "clob",
        CLOB_SECRET: "clob-secret",
        CLOB_PASS_PHRASE: "clob-pass",
        CLOB_API_URL: "https://clob.polymarket.com",
        POLYGON_RPC_URL: "https://polygon-rpc.example",
        PUSD_ADDRESS: address,
        DEPOSIT_WALLET_FACTORY_ADDRESS: address
      })
    );

    expect(status.status).toBe("ready");
  });

  it("keeps top-up disabled by default and does not fake balances or status", async () => {
    const envKeys = [
      "POLYMARKET_LIVE_TOP_UP_ENABLED",
      "RELAYER_URL",
      "POLYGON_RPC_URL",
      "CLOB_API_KEY",
      "CLOB_SECRET",
      "CLOB_PASS_PHRASE",
      "CLOB_API_URL"
    ] as const;
    const previous = Object.fromEntries(
      envKeys.map((key) => [key, process.env[key]])
    );
    process.env.POLYMARKET_LIVE_TOP_UP_ENABLED = "false";
    for (const key of envKeys.filter((key) => key !== "POLYMARKET_LIVE_TOP_UP_ENABLED")) {
      delete process.env[key];
    }

    try {
      const snapshot = await buildLiveTopUpFundingSnapshot({ address });

      expect(snapshot.env.status).toBe("blocked");
      expect(snapshot.env.enabled).toBe(false);
      expect(snapshot.readiness.canSubmitLiveOrder).toBe(false);
      expect(snapshot.balances.connectedWalletPusd.status).toBe("unavailable");
      expect(snapshot.balances.connectedWalletPusd.atoms).toBeNull();
      expect(snapshot.balances.depositWalletPusd.status).toBe("unavailable");
      expect(snapshot.balances.depositWalletPusd.atoms).toBeNull();
      expect(snapshot.balances.clob.status).toBe("unavailable");
      expect(snapshot.balances.clob.balance).toBeNull();
      expect(snapshot.balances.clob.allowance).toBeNull();
      expect(snapshot.depositWallet.status).toBe("available");
      if (snapshot.depositWallet.status === "available") {
        expect(snapshot.depositWallet.deployed).toBeNull();
        expect(snapshot.depositWallet.deployedStatus).toBe("unknown");
      }
    } finally {
      for (const key of envKeys) {
        const value = previous[key];
        if (value === undefined) {
          delete process.env[key];
        } else {
          process.env[key] = value;
        }
      }
    }
  });
});
