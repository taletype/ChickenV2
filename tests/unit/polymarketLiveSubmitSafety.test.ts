import { describe, expect, it } from "vitest";
import type { ServerEnv } from "@/lib/env/server-env";
import type { PolymarketMarket } from "@/lib/polymarket/types";
import { buildRedactedPolymarketDiagnostics } from "@/lib/polymarket/live-trading-audit";
import { prepareSignedPolymarketOrder } from "@/lib/polymarket/order-preparation";
import { submitViaSdkFirstAdapter } from "@/lib/polymarket/sdk-first";

const owner = "0x000000000000000000000000000000000000beef";
const otherWallet = "0x000000000000000000000000000000000000cafe";
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
    POLYMARKET_BUILDER_CODE: "0x0000000000000000000000000000000000000000000000000000000000000002",
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
  side: "BUY" as const,
  price: 0.5,
  size: 10,
  ownerAddress: owner,
  funderAddress: owner,
  walletChainId: 137,
  riskDisclosureAccepted: true
};

const signedOrder = {
  salt: "1",
  maker: owner,
  signer: owner,
  tokenId: "123",
  makerAmount: "500000",
  takerAmount: "1000000",
  side: "BUY" as const,
  signatureType: 2,
  timestamp: "1",
  metadata: `0x${"0".repeat(64)}`,
  builder: `0x${"2".repeat(64)}`,
  expiration: "0",
  signature: `0x${"a".repeat(130)}`
};

const readMarketBySlug = async (slug: string) => (slug === market.slug ? market : null);
const collateralReady = async () => ({ ready: true as const });

describe("V2 live submit safety architecture", () => {
  it("prepares only after canonical market and token validation pass", async () => {
    const result = await prepareSignedPolymarketOrder(
      { intent },
      { credentials, env: env(), readMarketBySlug }
    );

      expect(result.status).toBe("ready");
    if (result.status === "ready") {
      expect(result.canonical.market.id).toBe(market.id);
      expect(result.canonical.outcome.tokenId).toBe("123");
      expect(result.order.tokenId).toBe("123");
      expect(result.order).not.toHaveProperty("signature");
      expect(result.typedData.primaryType).toBe("Order");
      expect(result.requiresSignature).toBe(true);
    }
  });

  it("blocks invalid market/token pairs", async () => {
    const result = await prepareSignedPolymarketOrder(
      { intent: { ...intent, tokenId: "999" } },
      { credentials, env: env(), readMarketBySlug }
    );

    expect(result.status).toBe("blocked");
    expect(result.status === "blocked" ? result.code : null).toBe("invalid_market_token");
  });

  it("blocks wrong-chain readiness before preparing a signing payload", async () => {
    const result = await prepareSignedPolymarketOrder(
      { intent: { ...intent, walletChainId: 1 } },
      { credentials, env: env(), readMarketBySlug }
    );

    expect(result.status).toBe("blocked");
    expect(result.status === "blocked" ? result.code : null).toBe("wrong_chain");
  });

  it("blocks missing L2 credentials", async () => {
    const result = await prepareSignedPolymarketOrder(
      { intent },
      { env: env(), readMarketBySlug }
    );

    expect(result.status).toBe("blocked");
    expect(result.status === "blocked" ? result.code : null).toBe("missing_l2_credentials");
  });

  it("blocks signed orders from the wrong signer or wallet", async () => {
    const result = await submitViaSdkFirstAdapter(
      { intent, signedOrder: { ...signedOrder, signer: otherWallet } },
      {
        checkCollateralReadiness: collateralReady,
        credentials,
        env: env(),
        readMarketBySlug
      }
    );

    expect(result.status).toBe("blocked");
    expect(result.status === "blocked" ? result.code : null).toBe(
      "signed_order_identity_mismatch"
    );
  });

  it("blocks when live trading is disabled", async () => {
    const result = await prepareSignedPolymarketOrder(
      { intent },
      {
        credentials,
        env: env({ POLYMARKET_PUBLIC_LIVE_ENABLED: false }),
        readMarketBySlug
      }
    );

    expect(result.status).toBe("blocked");
    expect(result.status === "blocked" ? result.code : null).toBe("live_trading_disabled");
  });

  it("keeps submit blocked until collateral is ready", async () => {
    const result = await submitViaSdkFirstAdapter(
      { intent, signedOrder },
      {
        credentials,
        env: env(),
        checkCollateralReadiness: async () => ({
          ready: false,
          diagnostics: { collateralReady: false }
        }),
        readMarketBySlug
      }
    );

    expect(result.status).toBe("blocked");
    expect(result.status === "blocked" ? result.code : null).toBe(
      "collateral_not_ready"
    );
  });

  it("submits through the SDK adapter once minimal gates pass", async () => {
    const result = await submitViaSdkFirstAdapter(
      { intent, signedOrder, idempotencyKey: "client-123" },
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

    expect(result.status).toBe("submitted");
    expect(result.status === "submitted" ? result.orderId : null).toBe("order-123");
  });

  it("redacts diagnostics before returning audit-safe metadata", () => {
    const diagnostics = buildRedactedPolymarketDiagnostics({
      apiKey: "secret-key",
      nested: { passphrase: "secret-passphrase" },
      signature: signedOrder.signature,
      tokenId: "123"
    });

    expect(diagnostics.apiKey).toBe("[REDACTED]");
    expect((diagnostics.nested as Record<string, unknown>).passphrase).toBe(
      "[REDACTED]"
    );
    expect(diagnostics.signature).toBe("[REDACTED]");
    expect(diagnostics.tokenId).toBe("123");
  });

  it("does not invent market, account, or submitted-order data during prepare", async () => {
    const result = await prepareSignedPolymarketOrder(
      { intent },
      { credentials, env: env(), readMarketBySlug }
    );

    expect(result.status).toBe("ready");
    if (result.status === "ready") {
      expect(result.canonical.market.slug).toBe(market.slug);
      expect(result.attempt.externalOrderId).toBeNull();
      expect(result.diagnostics).not.toHaveProperty("balance");
      expect(result.diagnostics).not.toHaveProperty("account");
    }
  });
});
