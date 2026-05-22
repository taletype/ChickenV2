import "server-only";
import {
  AssetType,
  Chain,
  ClobClient,
  OrderType,
  SignatureTypeV2,
  type BalanceAllowanceResponse,
  type ClobClientOptions,
  type SignedOrder
} from "@polymarket/clob-client-v2";
import type { ServerEnv } from "@/lib/env/server-env";
import { getServerEnv } from "@/lib/env/server-env";
import { normalizeEvmAddress, type EvmAddress } from "@/lib/wallet/address";
import {
  getPolymarketL2CredentialReadiness,
  type PolymarketApiKeyCredentials
} from "../l2-credentials";
import {
  buildRedactedPolymarketDiagnostics,
  recordPolymarketLiveTradingAuditEvent
} from "../live-trading-audit";
import {
  canonicalOrderMarketErrorLabel,
  resolveCanonicalPolymarketOrderMarket,
  type ResolveCanonicalPolymarketOrderMarketOptions
} from "../server-order-market";
import type { SubmitSignedOrderClientResult } from "../submit-signed-order-client";
import {
  submitSignedOrderRequestSchema,
  type SubmitSignedOrderRequest
} from "../submit-signed-order-request";

type SdkSignedOrder = Record<string, unknown>;

type LiveSubmitBlockerCode =
  | "live_trading_disabled"
  | "live_submit_disabled"
  | "operator_confirmation_missing"
  | "kill_switch_active"
  | "invalid_order"
  | "market_not_tradable"
  | "invalid_market_token"
  | "wallet_identity_missing"
  | "signed_order_identity_mismatch"
  | "missing_user_signature"
  | "missing_l2_credentials"
  | "collateral_not_ready";

export type SdkPostOrderInput = {
  chainId: number;
  clobHost: string;
  credentials: PolymarketApiKeyCredentials;
  orderType: SubmitSignedOrderRequest["intent"]["orderType"];
  signedOrder: SdkSignedOrder;
  signerAddress: EvmAddress;
};

export type SdkPostOrder = (input: SdkPostOrderInput) => Promise<unknown>;

export type CollateralReadinessResult =
  | {
      ready: true;
      diagnostics?: Record<string, unknown>;
    }
  | {
      ready: false;
      code?: "collateral_not_ready";
      message?: string;
      diagnostics?: Record<string, unknown>;
    };

export type CheckCollateralReadiness = (input: {
  chainId: number;
  clobHost: string;
  credentials: PolymarketApiKeyCredentials;
  funderAddress: EvmAddress;
  ownerAddress: EvmAddress;
  requiredAmountUsd: number;
  signedOrder: SdkSignedOrder;
}) => Promise<CollateralReadinessResult>;

export type SubmitViaSdkFirstOptions = ResolveCanonicalPolymarketOrderMarketOptions & {
  checkCollateralReadiness?: CheckCollateralReadiness;
  credentials?: PolymarketApiKeyCredentials | null;
  env?: ServerEnv;
  sdkPostOrder?: SdkPostOrder;
};

export type LiveSignedOrderSubmitAdapter = {
  configured: true;
  submit(input: {
    credentials: PolymarketApiKeyCredentials;
    signedOrder: Record<string, unknown>;
  }): Promise<SubmitSignedOrderClientResult>;
};

export const LEGACY_SIGNED_SUBMIT_ADAPTER_NOT_CONFIGURED_CODE =
  "signed_submit_adapter_not_configured";

const BLOCKER_MESSAGES: Record<LiveSubmitBlockerCode, string> = {
  live_trading_disabled: "Live trading is disabled.",
  live_submit_disabled: "Live order submit is disabled.",
  operator_confirmation_missing: "Operator live-trading confirmation is missing.",
  kill_switch_active: "Live trading kill switch is active.",
  invalid_order: "Order failed server validation.",
  market_not_tradable: "Market is not tradable.",
  invalid_market_token: "Token does not belong to the canonical market outcome.",
  wallet_identity_missing: "Wallet identity is required before live submit.",
  signed_order_identity_mismatch:
    "Signed order maker/signer does not match wallet context.",
  missing_user_signature: "User signed order is required.",
  missing_l2_credentials: "Polymarket L2 credentials are missing.",
  collateral_not_ready: "CLOB collateral balance and allowance must be ready."
};

function redactedDiagnostics(metadata: Record<string, unknown>) {
  return buildRedactedPolymarketDiagnostics({
    phase: "submit",
    ...metadata
  });
}

function blocked(input: {
  code: LiveSubmitBlockerCode;
  diagnostics?: Record<string, unknown>;
  marketSlug?: string | null;
  message?: string;
  walletAddress?: string | null;
}): SubmitSignedOrderClientResult {
  const diagnostics = redactedDiagnostics({
    reason: input.code,
    ...input.diagnostics
  });

  recordPolymarketLiveTradingAuditEvent({
    name: "order_submit_blocked",
    walletAddress: input.walletAddress,
    marketSlug: input.marketSlug,
    reason: input.code,
    metadata: diagnostics
  });

  return {
    status: "blocked",
    code: input.code,
    message: input.message ?? BLOCKER_MESSAGES[input.code],
    diagnostics
  };
}

function failed(input: {
  code: string;
  diagnostics?: Record<string, unknown>;
  marketSlug?: string | null;
  message: string;
  walletAddress?: string | null;
}): SubmitSignedOrderClientResult {
  const diagnostics = redactedDiagnostics({
    reason: input.code,
    ...input.diagnostics
  });

  recordPolymarketLiveTradingAuditEvent({
    name: "order_submit_failed",
    walletAddress: input.walletAddress,
    marketSlug: input.marketSlug,
    reason: input.code,
    metadata: diagnostics
  });

  return {
    status: "failed",
    code: input.code,
    message: input.message,
    diagnostics
  };
}

function createAddressOnlySigner(
  signerAddress: EvmAddress
): NonNullable<ClobClientOptions["signer"]> {
  return {
    async getAddress() {
      return signerAddress;
    },
    async _signTypedData() {
      throw new Error("server_wallet_signing_disabled");
    }
  } as NonNullable<ClobClientOptions["signer"]>;
}

function chainForEnv(chainId: number) {
  return chainId === Chain.POLYGON ? Chain.POLYGON : (chainId as Chain);
}

function sdkOrderType(
  orderType: SubmitSignedOrderRequest["intent"]["orderType"]
) {
  return orderType === "FOK" ? OrderType.FOK : OrderType.GTC;
}

function signatureTypeForOrder(signedOrder: SdkSignedOrder) {
  const value = Number(signedOrder.signatureType);
  if (value === 0 || value === 1 || value === 2 || value === 3) {
    return value as SignatureTypeV2;
  }
  return SignatureTypeV2.POLY_GNOSIS_SAFE;
}

function parseAmount(value: unknown) {
  if (typeof value !== "string" && typeof value !== "number") {
    return 0;
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function parseAllowance(response: BalanceAllowanceResponse) {
  const direct = (response as BalanceAllowanceResponse & { allowance?: unknown })
    .allowance;
  if (direct) {
    return parseAmount(direct);
  }

  return Math.max(
    0,
    ...Object.values(response.allowances ?? {}).map((value) => parseAmount(value))
  );
}

export async function postSignedOrderWithPolymarketSdk(
  input: SdkPostOrderInput
) {
  const client = new ClobClient({
    host: input.clobHost,
    chain: chainForEnv(input.chainId),
    signer: createAddressOnlySigner(input.signerAddress),
    creds: input.credentials,
    signatureType: signatureTypeForOrder(input.signedOrder),
    funderAddress: stringField(input.signedOrder, "maker") ?? input.signerAddress
  });

  return client.postOrder(
    input.signedOrder as SignedOrder,
    sdkOrderType(input.orderType)
  );
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object"
    ? (value as Record<string, unknown>)
    : null;
}

function stringField(value: unknown, key: string) {
  const record = asRecord(value);
  const field = record?.[key];
  return typeof field === "string" && field.trim().length > 0
    ? field.trim()
    : null;
}

function stringFromKeys(record: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === "string" && value.trim().length > 0) {
      return value.trim();
    }
  }
  return null;
}

function errorMessageFrom(value: unknown) {
  if (typeof value === "string") {
    return value;
  }
  const record = asRecord(value);
  if (!record) {
    return null;
  }
  return (
    stringFromKeys(record, ["errorMsg", "error", "message", "detail"]) ??
    JSON.stringify(value)
  );
}

function valuesMatch(left: string | null | undefined, right: string | null | undefined) {
  return left?.trim().toLowerCase() === right?.trim().toLowerCase();
}

function assertLiveSubmitEnv(env: ServerEnv): LiveSubmitBlockerCode | null {
  if (!env.POLYMARKET_PUBLIC_LIVE_ENABLED) {
    return "live_trading_disabled";
  }
  if (!env.POLYMARKET_LIVE_SUBMIT_ENABLED) {
    return "live_submit_disabled";
  }
  if (
    env.POLYMARKET_OPERATOR_CONFIRM_LIVE_TRADING !==
    "I_UNDERSTAND_REAL_ORDERS"
  ) {
    return "operator_confirmation_missing";
  }
  if (env.POLYMARKET_LIVE_TRADING_KILL_SWITCH) {
    return "kill_switch_active";
  }
  return null;
}

async function defaultCollateralReadiness(input: {
  chainId: number;
  clobHost: string;
  credentials: PolymarketApiKeyCredentials;
  funderAddress: EvmAddress;
  ownerAddress: EvmAddress;
  requiredAmountUsd: number;
  signedOrder: SdkSignedOrder;
}): Promise<CollateralReadinessResult> {
  const client = new ClobClient({
    host: input.clobHost,
    chain: chainForEnv(input.chainId),
    signer: createAddressOnlySigner(input.ownerAddress),
    creds: input.credentials,
    signatureType: signatureTypeForOrder(input.signedOrder),
    funderAddress: input.funderAddress
  });
  const response = await client.getBalanceAllowance({
    asset_type: AssetType.COLLATERAL
  });
  const balance = parseAmount(response.balance);
  const allowance = parseAllowance(response);
  const balanceReady = balance >= input.requiredAmountUsd;
  const allowanceReady = allowance >= input.requiredAmountUsd;

  return balanceReady && allowanceReady
    ? {
        ready: true,
        diagnostics: {
          collateralReady: true,
          clobAllowanceReady: true,
          clobBalanceReady: true
        }
      }
    : {
        ready: false,
        diagnostics: {
          collateralReady: false,
          clobAllowanceReady: allowanceReady,
          clobBalanceReady: balanceReady
        }
      };
}

function normalizeSubmittedResponse(
  response: unknown
): SubmitSignedOrderClientResult {
  const record = asRecord(response);

  if (!record) {
    return failed({
      code: "sdk_submit_unrecognized_response",
      message: "SDK live submit returned an unrecognized response.",
      diagnostics: { sdkResponse: response }
    });
  }

  const errorMessage = errorMessageFrom(record.error ?? record.errorMsg);
  if (record.success === false || errorMessage) {
    return failed({
      code: "sdk_submit_rejected",
      message: errorMessage ?? "SDK rejected the live order.",
      diagnostics: {
        sdkResponse: response,
        sdkStatus: record.status
      }
    });
  }

  const orderId = stringFromKeys(record, ["orderID", "orderId", "id"]);
  if (!orderId) {
    return failed({
      code: "sdk_submit_unrecognized_response",
      message: "SDK live submit did not return an order id.",
      diagnostics: {
        sdkResponse: response,
        sdkStatus: record.status
      }
    });
  }

  const diagnostics = redactedDiagnostics({
    orderId,
    sdkStatus: typeof record.status === "string" ? record.status : undefined
  });

  recordPolymarketLiveTradingAuditEvent({
    name: "order_submitted",
    metadata: diagnostics
  });

  return {
    status: "submitted",
    orderId,
    sdkStatus: typeof record.status === "string" ? record.status : undefined,
    diagnostics
  };
}

function normalizeSdkThrownError(error: unknown): SubmitSignedOrderClientResult {
  const record = asRecord(error);
  const message =
    error instanceof Error
      ? error.message
      : errorMessageFrom(error) ?? "SDK live submit failed.";

  return failed({
    code: "sdk_submit_failed",
    message,
    diagnostics: {
      errorName: error instanceof Error ? error.name : undefined,
      sdkError: record
        ? {
            code: record.code,
            data: record.data,
            status: record.status
          }
        : undefined
    }
  });
}

export function normalizePolymarketSdkSubmitResponse(
  response: unknown
): SubmitSignedOrderClientResult {
  return normalizeSubmittedResponse(response);
}

function assertSignedOrderIdentity(input: {
  funderAddress: EvmAddress;
  intentTokenId: string;
  ownerAddress: EvmAddress;
  signedOrder: SdkSignedOrder;
}): LiveSubmitBlockerCode | null {
  const signedMaker = normalizeEvmAddress(stringField(input.signedOrder, "maker"));
  const signedSigner = normalizeEvmAddress(stringField(input.signedOrder, "signer"));
  const signedTokenId = stringField(input.signedOrder, "tokenId");
  const signatureType = Number(input.signedOrder.signatureType);
  const expectedSigner =
    signatureType === SignatureTypeV2.POLY_1271
      ? input.funderAddress
      : input.ownerAddress;

  if (signedMaker && signedMaker !== input.funderAddress) {
    return "signed_order_identity_mismatch";
  }
  if (signedSigner && signedSigner !== expectedSigner) {
    return "signed_order_identity_mismatch";
  }
  if (signedTokenId && signedTokenId !== input.intentTokenId) {
    return "invalid_market_token";
  }
  return null;
}

export async function submitViaSdkFirstAdapter(
  payload: unknown,
  options: SubmitViaSdkFirstOptions = {}
): Promise<SubmitSignedOrderClientResult> {
  const parsed = submitSignedOrderRequestSchema.safeParse(payload);
  if (!parsed.success) {
    return blocked({
      code: "invalid_order",
      diagnostics: { reason: "invalid_submit_payload" },
      message: "Submit payload failed validation."
    });
  }

  const env = options.env ?? getServerEnv();
  const request = parsed.data;
  const intent = request.intent;
  const envBlocker = assertLiveSubmitEnv(env);

  if (envBlocker) {
    return blocked({
      code: envBlocker,
      diagnostics: { gates: { liveEnvEnabled: false } },
      marketSlug: intent.marketSlug,
      walletAddress: intent.ownerAddress
    });
  }

  const ownerAddress = normalizeEvmAddress(intent.ownerAddress);
  const funderAddress = normalizeEvmAddress(intent.funderAddress ?? intent.ownerAddress);
  if (!ownerAddress || !funderAddress) {
    return blocked({
      code: "wallet_identity_missing",
      marketSlug: intent.marketSlug,
      walletAddress: intent.ownerAddress
    });
  }

  const signedOrder = asRecord(request.signedOrder);
  if (!signedOrder) {
    return blocked({
      code: "missing_user_signature",
      marketSlug: intent.marketSlug,
      walletAddress: ownerAddress
    });
  }

  const canonical = await resolveCanonicalPolymarketOrderMarket(
    {
      marketId: intent.marketId,
      marketSlug: intent.marketSlug,
      tokenId: intent.tokenId
    },
    options
  );

  if (canonical.status !== "ready") {
    const code =
      canonical.error === "market_not_tradable"
        ? "market_not_tradable"
        : canonical.error === "invalid_market_token"
          ? "invalid_market_token"
          : "invalid_order";
    return blocked({
      code,
      diagnostics: {
        canonicalError: canonical.error,
        tokenId: intent.tokenId
      },
      marketSlug: intent.marketSlug,
      message: canonicalOrderMarketErrorLabel(canonical.error),
      walletAddress: ownerAddress
    });
  }

  const outcomeIdMatches =
    !intent.outcomeId ||
    intent.outcomeId === canonical.outcome.tokenId ||
    valuesMatch(intent.outcomeId, canonical.outcome.label);
  const outcomeLabelMatches = valuesMatch(intent.outcome, canonical.outcome.label);
  if (!outcomeIdMatches || !outcomeLabelMatches) {
    return blocked({
      code: "invalid_market_token",
      diagnostics: {
        expectedOutcome: canonical.outcome.label,
        expectedTokenId: canonical.outcome.tokenId,
        outcome: intent.outcome,
        outcomeId: intent.outcomeId,
        tokenId: intent.tokenId
      },
      marketSlug: intent.marketSlug,
      walletAddress: ownerAddress
    });
  }

  const identityBlocker = assertSignedOrderIdentity({
    funderAddress,
    intentTokenId: intent.tokenId,
    ownerAddress,
    signedOrder
  });
  if (identityBlocker) {
    return blocked({
      code: identityBlocker,
      diagnostics: {
        maker: stringField(signedOrder, "maker"),
        signer: stringField(signedOrder, "signer"),
        tokenId: stringField(signedOrder, "tokenId")
      },
      marketSlug: intent.marketSlug,
      walletAddress: ownerAddress
    });
  }

  const credentialReadiness = getPolymarketL2CredentialReadiness({
    credentials: options.credentials,
    env
  });
  if (credentialReadiness.status !== "ready") {
    return blocked({
      code: "missing_l2_credentials",
      diagnostics: credentialReadiness.metadata,
      marketSlug: intent.marketSlug,
      walletAddress: ownerAddress
    });
  }

  const requiredAmountUsd = intent.price * intent.size;
  let collateralReadiness: CollateralReadinessResult;
  try {
    collateralReadiness = await (options.checkCollateralReadiness ??
      defaultCollateralReadiness)({
      chainId: env.POLYMARKET_CHAIN_ID,
      clobHost: env.POLYMARKET_CLOB_API_BASE_URL,
      credentials: credentialReadiness.credentials,
      funderAddress,
      ownerAddress,
      requiredAmountUsd,
      signedOrder
    });
  } catch (error) {
    return blocked({
      code: "collateral_not_ready",
      diagnostics: {
        collateralReady: false,
        collateralReadError:
          error instanceof Error ? error.message : "collateral_read_failed"
      },
      marketSlug: intent.marketSlug,
      walletAddress: ownerAddress
    });
  }

  if (!collateralReadiness.ready) {
    return blocked({
      code: collateralReadiness.code ?? "collateral_not_ready",
      diagnostics: collateralReadiness.diagnostics,
      marketSlug: intent.marketSlug,
      message: collateralReadiness.message,
      walletAddress: ownerAddress
    });
  }

  try {
    return normalizeSubmittedResponse(
      await (options.sdkPostOrder ?? postSignedOrderWithPolymarketSdk)({
        chainId: env.POLYMARKET_CHAIN_ID,
        clobHost: env.POLYMARKET_CLOB_API_BASE_URL,
        credentials: credentialReadiness.credentials,
        orderType: intent.orderType,
        signedOrder,
        signerAddress: ownerAddress
      })
    );
  } catch (error) {
    return normalizeSdkThrownError(error);
  }
}
