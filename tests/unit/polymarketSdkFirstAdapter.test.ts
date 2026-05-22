import { describe, expect, it } from "vitest";
import type { ServerEnv } from "@/lib/env/server-env";
import {
  normalizePolymarketSdkSubmitResponse,
  submitViaSdkFirstAdapter
} from "@/lib/polymarket/sdk-first";
import type { PolymarketMarket } from "@/lib/polymarket/types";

const owner = "0x000000000000000000000000000000000000beef";
const credentials = {
  key: "clob-key",
  secret: "clob-secret",
  passphrase: "clob-passphrase"
};

function env(overrides: Partial<ServerEnv> = {}): ServerEnv {
  return {
    POLYMARKET_GAMMA_API_BASE_URL: "https://gamma-api.polymarket.com",
    POLYMARKET_CLOB_API_BASE_URL: "https://clob.polymarket.com",
    POLYMARKET_DATA_API_BASE_URL: "https://data-api.polymarket.com",
    POLYMARKET_MARKET_CACHE_TTL_MS: 60_000,
    POLYMARKET_PUBLIC_LIVE_ENABLED: true,
    POLYMARKET_LIVE_SUBMIT_ENABLED: true,
    POLYMARKET_LIVE_TRADING_KILL_SWITCH: false,
    POLYMARKET_DRY_RUN_ENABLED: false,
    POLYMARKET_BUILDER_CODE: undefined,
    POLYMARKET_OPERATOR_CONFIRM_LIVE_TRADING: "I_UNDERSTAND_REAL_ORDERS",
    POLYMARKET_REQUIRE_L2_CREDENTIALS: true,
    POLYMARKET_REQUIRE_BUILDER_CODE: true,
    POLYMARKET_CHAIN_ID: 137,
    POLYMARKET_MAX_ORDER_NOTIONAL_USD: 100,
    POLYMARKET_SIGNER_HEALTH_STATUS: "ok",
    POLYMARKET_OFFICIAL_FUNDING_URL: "https://polymarket.com/portfolio",
    POLYMARKET_COLLATERAL_SETUP_ENABLED: false,
    POLYMARKET_LIVE_TOP_UP_ENABLED: false,
    POLYMARKET_LIVE_TOP_UP_KILL_SWITCH: true,
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

const market: PolymarketMarket = {
  id: "market-1",
  conditionId: "condition-1",
  slug: "will-it-rain",
  question: "Will it rain?",
  description: null,
  category: null,
  image: null,
  volume24hr: null,
  liquidity: null,
  createdAt: null,
  endDate: null,
  active: true,
  closed: false,
  archived: false,
  negRisk: false,
  tickSize: 0.01,
  minimumOrderSize: 5,
  resolutionSource: null,
  resolutionSourceUrl: null,
  outcomes: [
    { label: "Yes", tokenId: "123", price: 0.5, tradable: true },
    { label: "No", tokenId: "456", price: 0.5, tradable: true }
  ],
  sourceUpdatedAt: "2026-05-22T00:00:00.000Z",
  fetchedAt: "2026-05-22T00:00:00.000Z"
};

const intent = {
  tokenId: "123",
  marketId: market.id,
  marketSlug: market.slug,
  outcome: "Yes",
  outcomeId: "123",
  side: "BUY" as const,
  price: 0.5,
  size: 10,
  ownerAddress: owner,
  funderAddress: owner,
  walletChainId: 137,
  riskDisclosureAccepted: true
};

const signedOrder = {
  maker: owner,
  signer: owner,
  tokenId: "123",
  signatureType: 2,
  signature: `0x${"a".repeat(130)}`
};

const readMarketBySlug = async (slug: string) => (slug === market.slug ? market : null);
const collateralReady = async () => ({ ready: true as const });

describe("sdk-first live submit adapter", () => {
  it("blocks by default", async () => {
    const result = await submitViaSdkFirstAdapter({ intent, signedOrder });

    expect(result.status).toBe("blocked");
    expect(result.status === "blocked" ? result.code : null).toBe(
      "live_trading_disabled"
    );
  });

  it("blocks when the kill switch is active", async () => {
    const result = await submitViaSdkFirstAdapter(
      { intent, signedOrder },
      {
        env: env({ POLYMARKET_LIVE_TRADING_KILL_SWITCH: true })
      }
    );

    expect(result.status).toBe("blocked");
    expect(result.status === "blocked" ? result.code : null).toBe(
      "kill_switch_active"
    );
  });

  it("blocks missing SDK credentials", async () => {
    const result = await submitViaSdkFirstAdapter(
      { intent, signedOrder },
      { env: env(), readMarketBySlug }
    );

    expect(result.status).toBe("blocked");
    expect(result.status === "blocked" ? result.code : null).toBe(
      "missing_l2_credentials"
    );
  });

  it("blocks canonical market/token mismatches", async () => {
    const result = await submitViaSdkFirstAdapter(
      {
        intent: { ...intent, tokenId: "999", outcomeId: "999" },
        signedOrder: { ...signedOrder, tokenId: "999" }
      },
      {
        credentials,
        env: env(),
        readMarketBySlug
      }
    );

    expect(result.status).toBe("blocked");
    expect(result.status === "blocked" ? result.code : null).toBe(
      "invalid_market_token"
    );
  });

  it("normalizes SDK success responses", async () => {
    const result = await submitViaSdkFirstAdapter(
      { intent, signedOrder },
      {
        checkCollateralReadiness: collateralReady,
        credentials,
        env: env(),
        readMarketBySlug,
        sdkPostOrder: async () => ({
          success: true,
          orderID: "order-123",
          status: "live"
        })
      }
    );

    expect(result).toMatchObject({
      status: "submitted",
      orderId: "order-123",
      sdkStatus: "live"
    });
  });

  it("normalizes SDK error responses", async () => {
    const result = await submitViaSdkFirstAdapter(
      { intent, signedOrder },
      {
        checkCollateralReadiness: collateralReady,
        credentials,
        env: env(),
        readMarketBySlug,
        sdkPostOrder: async () => ({
          success: false,
          errorMsg: "insufficient balance",
          status: "rejected"
        })
      }
    );

    expect(result).toMatchObject({
      status: "failed",
      code: "sdk_submit_rejected",
      message: "insufficient balance"
    });
  });

  it("redacts diagnostics from normalized SDK errors", () => {
    const result = normalizePolymarketSdkSubmitResponse({
      success: false,
      errorMsg: "rejected",
      apiKey: "secret-key",
      nested: {
        passphrase: "secret-passphrase",
        signature: `0x${"b".repeat(130)}`
      },
      status: "rejected"
    });
    const sdkResponse = result.diagnostics?.sdkResponse as Record<string, unknown>;
    const nested = sdkResponse.nested as Record<string, unknown>;

    expect(result.status).toBe("failed");
    expect(sdkResponse.apiKey).toBe("[REDACTED]");
    expect(nested.passphrase).toBe("[REDACTED]");
    expect(nested.signature).toBe("[REDACTED]");
  });
});
