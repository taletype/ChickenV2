import type {
  ClobClientOptions,
  CreateOrderOptions,
  SignedOrder,
  TickSize
} from "@polymarket/clob-client-v2";
import {
  Chain,
  ClobClient,
  OrderType,
  Side,
  SignatureTypeV2
} from "@polymarket/clob-client-v2";
import type { PolymarketOrderIntent } from "./order-validation";
import type { TradingWalletContext } from "@/lib/wallet/trading-wallet-context";

export type PolymarketUnsignedOrder = {
  tokenID: string;
  price: number;
  size: number;
  side: "BUY" | "SELL";
  marketSlug: string;
};

export function buildPolymarketUnsignedOrder(
  intent: PolymarketOrderIntent
): PolymarketUnsignedOrder {
  return {
    tokenID: intent.tokenId,
    price: intent.price,
    size: intent.size,
    side: intent.side,
    marketSlug: intent.marketSlug
  };
}

export type PolymarketOrderTypedData = {
  domain: Record<string, unknown>;
  types: Record<string, Array<{ name: string; type: string }>>;
  primaryType: string;
  message: Record<string, unknown>;
};

export type SignablePolymarketOrderDraft = {
  order: Omit<SignedOrder, "signature">;
  orderType: "GTC" | "FOK";
  sdkSignatureSuffix: string;
  tickSize: TickSize;
  typedData: PolymarketOrderTypedData;
};

const PLACEHOLDER_SIGNATURE = `0x${"1".repeat(130)}`;
const DEFAULT_CLOB_HOST = "https://clob.polymarket.com";

function cloneJson<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function normalizeSide(side: PolymarketOrderIntent["side"]) {
  return side === "SELL" ? Side.SELL : Side.BUY;
}

function normalizeOrderType(orderType: PolymarketOrderIntent["orderType"]) {
  return orderType === "FOK" ? OrderType.FOK : OrderType.GTC;
}

function normalizeTickSize(value: number): TickSize {
  const normalized = String(value);
  if (
    normalized === "0.1" ||
    normalized === "0.01" ||
    normalized === "0.001" ||
    normalized === "0.0001"
  ) {
    return normalized;
  }
  return "0.01";
}

function signatureTypeForContext(context: Extract<TradingWalletContext, { status: "ready" }>) {
  return context.signatureType as SignatureTypeV2;
}

function createCapturingSigner(
  address: string,
  capture: (typedData: PolymarketOrderTypedData) => void
): NonNullable<ClobClientOptions["signer"]> {
  return {
    async getAddress() {
      return address;
    },
    async _signTypedData(domain, types, message) {
      capture({
        domain: cloneJson(domain as Record<string, unknown>),
        types: cloneJson(types as PolymarketOrderTypedData["types"]),
        primaryType: "TypedDataSign" in types ? "TypedDataSign" : "Order",
        message: cloneJson(message as Record<string, unknown>)
      });
      return PLACEHOLDER_SIGNATURE;
    }
  } as NonNullable<ClobClientOptions["signer"]>;
}

function seedOfflineOrderMetadata(
  client: ClobClient,
  tokenId: string,
  options: CreateOrderOptions
) {
  client.tickSizes[tokenId] = options.tickSize;
  client.negRisk[tokenId] = Boolean(options.negRisk);
  (client as unknown as { cachedVersion?: number }).cachedVersion = 2;
}

export async function buildSignablePolymarketOrderDraft(input: {
  builderCode: string;
  chainId: number;
  clobHost?: string;
  intent: PolymarketOrderIntent;
  negRisk?: boolean | null;
  walletContext: Extract<TradingWalletContext, { status: "ready" }>;
}): Promise<SignablePolymarketOrderDraft> {
  const typedDataRecords: PolymarketOrderTypedData[] = [];
  const orderType = normalizeOrderType(input.intent.orderType);
  const tickSize = normalizeTickSize(input.intent.tickSize);
  const options = {
    tickSize,
    negRisk: Boolean(input.negRisk)
  } satisfies CreateOrderOptions;
  const client = new ClobClient({
    host: input.clobHost ?? DEFAULT_CLOB_HOST,
    chain: input.chainId === 137 ? Chain.POLYGON : (input.chainId as Chain),
    signer: createCapturingSigner(input.walletContext.ownerAddress, (typedData) => {
      typedDataRecords.push(typedData);
    }),
    signatureType: signatureTypeForContext(input.walletContext),
    funderAddress: input.walletContext.funderAddress,
    builderConfig: { builderCode: input.builderCode },
    throwOnError: true
  });

  seedOfflineOrderMetadata(client, input.intent.tokenId, options);

  const placeholderSignedOrder = await client.createOrder(
    {
      tokenID: input.intent.tokenId,
      price: input.intent.price,
      size: input.intent.size,
      side: normalizeSide(input.intent.side),
      builderCode: input.builderCode
    },
    options
  );
  const typedData = typedDataRecords.at(-1);

  if (!typedData) {
    throw new Error("signing_typed_data_unavailable");
  }

  const { signature, ...order } = placeholderSignedOrder;

  if (
    typeof signature !== "string" ||
    !signature.toLowerCase().startsWith(PLACEHOLDER_SIGNATURE.toLowerCase())
  ) {
    throw new Error("placeholder_signature_capture_failed");
  }

  return {
    order,
    orderType,
    sdkSignatureSuffix: signature.slice(PLACEHOLDER_SIGNATURE.length),
    tickSize,
    typedData
  };
}
