import "server-only";
import type { ServerEnv } from "@/lib/env/server-env";
import { getServerEnv } from "@/lib/env/server-env";
import { normalizeEvmAddress } from "@/lib/wallet/address";
import type { PolymarketMarket } from "./types";
import { recordPolymarketLiveTradingAuditEvent } from "./live-trading-audit";

export type LiveTradingBlockerCode =
  | "live_trading_disabled"
  | "live_submit_disabled"
  | "operator_confirmation_missing"
  | "kill_switch_active"
  | "builder_code_missing"
  | "wallet_identity_missing"
  | "wallet_identity_mismatch"
  | "wrong_chain"
  | "missing_l2_credentials"
  | "signer_unhealthy"
  | "market_not_tradable"
  | "invalid_market_token"
  | "invalid_order"
  | "risk_disclosure_missing"
  | "missing_user_signature"
  | "signed_order_identity_mismatch"
  | "signed_order_payload_invalid"
  | "rate_limited"
  | "cooldown_active"
  | "notional_limit_exceeded";

export type LiveTradingBlocker = {
  code: LiveTradingBlockerCode;
  message: string;
};

export type LiveTradingConfig = {
  publicLiveEnabled: boolean;
  liveSubmitEnabled: boolean;
  killSwitchActive: boolean;
  operatorConfirmed: boolean;
  requireL2Credentials: boolean;
  requireBuilderCode: boolean;
  builderCodeConfigured: boolean;
  chainId: number;
  maxOrderNotionalUsd: number;
  signerHealthy: boolean;
};

export type LiveTradingReadiness =
  | {
      status: "ready";
      mode: "public";
      blockers: [];
      gates: Record<string, true>;
      config: LiveTradingConfig;
    }
  | {
      status: "blocked";
      mode: "blocked";
      blockers: LiveTradingBlocker[];
      gates: Record<string, boolean>;
      config: LiveTradingConfig;
    };

export type LiveTradingReadinessInput = {
  builderCode?: string | null;
  cooldownAllowed?: boolean | null;
  finalServerValidationOk?: boolean | null;
  hasUserSignedOrder?: boolean | null;
  l2CredentialsReady?: boolean | null;
  market?: Pick<
    PolymarketMarket,
    "active" | "archived" | "closed" | "outcomes" | "slug" | "id"
  > | null;
  marketSlug?: string | null;
  notionalUsd?: number | null;
  outcomeBelongsToMarket?: boolean | null;
  ownerAddress?: string | null;
  rateLimitAllowed?: boolean | null;
  riskDisclosureAccepted?: boolean | null;
  signedOrderIdentityMatches?: boolean | null;
  signedOrderPayloadValid?: boolean | null;
  signerAddress?: string | null;
  tokenId?: string | null;
  walletAddress?: string | null;
  walletChainId?: number | null;
};

const BLOCKER_MESSAGES: Record<LiveTradingBlockerCode, string> = {
  live_trading_disabled: "Live trading is disabled.",
  live_submit_disabled: "Live order submit is disabled.",
  operator_confirmation_missing: "Operator live-trading confirmation is missing.",
  kill_switch_active: "Live trading kill switch is active.",
  builder_code_missing: "Builder code is missing.",
  wallet_identity_missing: "Wallet identity is required.",
  wallet_identity_mismatch: "Wallet identity does not match the signer context.",
  wrong_chain: "Wallet must be on Polygon.",
  missing_l2_credentials: "Polymarket L2 credentials are missing.",
  signer_unhealthy: "Live signer health check failed.",
  market_not_tradable: "Market is not tradable.",
  invalid_market_token: "Token does not belong to the canonical market.",
  invalid_order: "Order failed server validation.",
  risk_disclosure_missing: "Risk disclosure must be accepted before live order flow.",
  missing_user_signature: "User signed order is required.",
  signed_order_identity_mismatch: "Signed order maker/signer does not match wallet context.",
  signed_order_payload_invalid: "Signed order payload does not match the validated order.",
  rate_limited: "Live order rate limit exceeded.",
  cooldown_active: "Failed-submit cooldown is active.",
  notional_limit_exceeded: "Order exceeds configured notional limit."
};

export function getPolymarketLiveTradingConfig(
  env: ServerEnv = getServerEnv(),
  overrides: Partial<LiveTradingConfig> = {}
): LiveTradingConfig {
  return {
    publicLiveEnabled: env.POLYMARKET_PUBLIC_LIVE_ENABLED,
    liveSubmitEnabled: env.POLYMARKET_LIVE_SUBMIT_ENABLED,
    killSwitchActive: env.POLYMARKET_LIVE_TRADING_KILL_SWITCH,
    operatorConfirmed:
      env.POLYMARKET_OPERATOR_CONFIRM_LIVE_TRADING ===
      "I_UNDERSTAND_REAL_ORDERS",
    requireL2Credentials: env.POLYMARKET_REQUIRE_L2_CREDENTIALS,
    requireBuilderCode: env.POLYMARKET_REQUIRE_BUILDER_CODE,
    builderCodeConfigured: Boolean(env.POLYMARKET_BUILDER_CODE?.trim()),
    chainId: env.POLYMARKET_CHAIN_ID,
    maxOrderNotionalUsd: env.POLYMARKET_MAX_ORDER_NOTIONAL_USD,
    signerHealthy: env.POLYMARKET_SIGNER_HEALTH_STATUS === "ok",
    ...overrides
  };
}

export function checkPolymarketSignerHealth(env: ServerEnv = getServerEnv()) {
  return env.POLYMARKET_SIGNER_HEALTH_STATUS === "ok";
}

function marketIsTradable(
  market: LiveTradingReadinessInput["market"] | null | undefined
) {
  return Boolean(market?.active && !market.closed && !market.archived);
}

function tokenBelongsToMarket(input: LiveTradingReadinessInput) {
  if (input.outcomeBelongsToMarket === false) {
    return false;
  }
  if (!input.tokenId) {
    return input.outcomeBelongsToMarket === true;
  }
  if (!input.market?.outcomes.length) {
    return input.outcomeBelongsToMarket === true;
  }
  return input.market.outcomes.some((outcome) => outcome.tokenId === input.tokenId);
}

function walletIdentityMatches(input: LiveTradingReadinessInput) {
  const owner = normalizeEvmAddress(input.ownerAddress ?? input.walletAddress);
  const signer = normalizeEvmAddress(input.signerAddress ?? input.walletAddress);
  const wallet = normalizeEvmAddress(input.walletAddress);

  if (!owner || !signer || !wallet) {
    return null;
  }

  return owner === wallet && signer === wallet;
}

function addBlocker(
  blockers: LiveTradingBlocker[],
  gates: Record<string, boolean>,
  gate: string,
  ready: boolean,
  code: LiveTradingBlockerCode
) {
  gates[gate] = ready;
  if (!ready) {
    blockers.push({ code, message: BLOCKER_MESSAGES[code] });
  }
}

export function evaluatePolymarketLiveTradingReadiness(
  input: LiveTradingReadinessInput = {},
  options: { env?: ServerEnv; config?: Partial<LiveTradingConfig> } = {}
): LiveTradingReadiness {
  const config = getPolymarketLiveTradingConfig(
    options.env ?? getServerEnv(),
    options.config
  );
  const gates: Record<string, boolean> = {};
  const blockers: LiveTradingBlocker[] = [];
  const notionalUsd = input.notionalUsd ?? null;
  const walletMatches = walletIdentityMatches(input);
  const builderReady = Boolean(
    input.builderCode?.trim() || config.builderCodeConfigured
  );

  addBlocker(
    blockers,
    gates,
    "publicLiveEnabled",
    config.publicLiveEnabled,
    "live_trading_disabled"
  );
  addBlocker(
    blockers,
    gates,
    "liveSubmitEnabled",
    config.liveSubmitEnabled,
    "live_submit_disabled"
  );
  addBlocker(
    blockers,
    gates,
    "operatorConfirmed",
    config.operatorConfirmed,
    "operator_confirmation_missing"
  );
  addBlocker(
    blockers,
    gates,
    "killSwitchInactive",
    !config.killSwitchActive,
    "kill_switch_active"
  );
  addBlocker(
    blockers,
    gates,
    "signerHealthy",
    config.signerHealthy,
    "signer_unhealthy"
  );
  addBlocker(
    blockers,
    gates,
    "builderCodeConfigured",
    !config.requireBuilderCode || builderReady,
    "builder_code_missing"
  );
  addBlocker(
    blockers,
    gates,
    "walletIdentityPresent",
    walletMatches !== null,
    "wallet_identity_missing"
  );
  addBlocker(
    blockers,
    gates,
    "walletIdentityMatches",
    walletMatches !== false,
    "wallet_identity_mismatch"
  );
  addBlocker(
    blockers,
    gates,
    "polygonNetwork",
    input.walletChainId == null || input.walletChainId === config.chainId,
    "wrong_chain"
  );
  addBlocker(
    blockers,
    gates,
    "l2CredentialsReady",
    !config.requireL2Credentials || input.l2CredentialsReady === true,
    "missing_l2_credentials"
  );
  addBlocker(
    blockers,
    gates,
    "riskDisclosureAccepted",
    input.riskDisclosureAccepted !== false,
    "risk_disclosure_missing"
  );
  addBlocker(
    blockers,
    gates,
    "marketTradable",
    !input.market || marketIsTradable(input.market),
    "market_not_tradable"
  );
  addBlocker(
    blockers,
    gates,
    "tokenBelongsToMarket",
    tokenBelongsToMarket(input),
    "invalid_market_token"
  );
  addBlocker(
    blockers,
    gates,
    "rateLimitAllowed",
    input.rateLimitAllowed !== false,
    "rate_limited"
  );
  addBlocker(
    blockers,
    gates,
    "cooldownAllowed",
    input.cooldownAllowed !== false,
    "cooldown_active"
  );
  addBlocker(
    blockers,
    gates,
    "notionalLimit",
    notionalUsd == null || notionalUsd <= config.maxOrderNotionalUsd,
    "notional_limit_exceeded"
  );
  addBlocker(
    blockers,
    gates,
    "userSignedOrder",
    input.hasUserSignedOrder !== false,
    "missing_user_signature"
  );
  addBlocker(
    blockers,
    gates,
    "signedOrderIdentityMatches",
    input.signedOrderIdentityMatches !== false,
    "signed_order_identity_mismatch"
  );
  addBlocker(
    blockers,
    gates,
    "signedOrderPayloadValid",
    input.signedOrderPayloadValid !== false,
    "signed_order_payload_invalid"
  );
  addBlocker(
    blockers,
    gates,
    "finalServerValidationOk",
    input.finalServerValidationOk !== false,
    "invalid_order"
  );

  const result =
    blockers.length === 0
      ? ({
          status: "ready",
          mode: "public",
          blockers: [],
          gates: gates as Record<string, true>,
          config
        } satisfies LiveTradingReadiness)
      : ({
          status: "blocked",
          mode: "blocked",
          blockers,
          gates,
          config
        } satisfies LiveTradingReadiness);

  recordPolymarketLiveTradingAuditEvent({
    name: "readiness_evaluated",
    walletAddress: input.walletAddress,
    marketSlug: input.marketSlug ?? input.market?.slug ?? null,
    reason: result.status === "ready" ? null : result.blockers[0]?.code ?? null,
    metadata: {
      status: result.status,
      blockers: result.blockers.map((blocker) => blocker.code),
      gates
    }
  });

  return result;
}

export function getLiveTradingReadiness() {
  return evaluatePolymarketLiveTradingReadiness();
}
