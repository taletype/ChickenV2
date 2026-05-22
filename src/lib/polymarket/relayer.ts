import "server-only";
import type {
  DepositWalletBatchRequest,
  DepositWalletCreateRequest
} from "@polymarket/builder-relayer-client";
import { BuilderConfig } from "@polymarket/builder-signing-sdk";
import { normalizeEvmAddress } from "@/lib/wallet/address";
import { assertLiveTopUpMutationAllowed } from "./live-topup-env";

type RelayerSubmitResult =
  | {
      status: "submitted";
      transactionID: string;
      state: string;
    }
  | {
      status: "blocked";
      code: string;
    };

function safeRelayerCode(value: unknown) {
  const text = typeof value === "string" ? value : "relayer_request_failed";
  return text
    .replace(/0x[a-fA-F0-9]{16,}/g, "redacted_hex")
    .replace(/[^a-zA-Z0-9:_-]+/g, "_")
    .slice(0, 96);
}

async function buildBuilderHeaders(method: string, path: string, body: string) {
  const gate = assertLiveTopUpMutationAllowed();
  if (gate.status !== "ready") {
    throw new Error(gate.reason);
  }

  const builderConfig = new BuilderConfig({
    localBuilderCreds: {
      key: gate.config.builderApiKey,
      secret: gate.config.builderSecret,
      passphrase: gate.config.builderPassPhrase
    }
  });
  const headers = await builderConfig.generateBuilderHeaders(method, path, body);
  if (!headers) {
    throw new Error("builder_headers_unavailable");
  }
  return headers;
}

async function submitRelayerPayload(
  payload: DepositWalletBatchRequest | DepositWalletCreateRequest
): Promise<RelayerSubmitResult> {
  const gate = assertLiveTopUpMutationAllowed();
  if (gate.status !== "ready") {
    return { status: "blocked", code: gate.reason };
  }

  const body = JSON.stringify(payload);
  const headers = await buildBuilderHeaders("POST", "/submit", body);
  const response = await fetch(`${gate.config.relayerUrl}/submit`, {
    method: "POST",
    cache: "no-store",
    headers: {
      accept: "application/json",
      "content-type": "application/json",
      ...headers
    },
    body
  }).catch(() => null);
  if (!response) {
    return { status: "blocked", code: "relayer_unavailable" };
  }

  const responsePayload = (await response.json().catch(() => null)) as
    | { transactionID?: unknown; state?: unknown; error?: unknown; code?: unknown }
    | null;
  if (!response.ok) {
    return {
      status: "blocked",
      code: safeRelayerCode(responsePayload?.code ?? responsePayload?.error)
    };
  }

  if (
    typeof responsePayload?.transactionID !== "string" ||
    typeof responsePayload.state !== "string"
  ) {
    return { status: "blocked", code: "relayer_response_invalid" };
  }

  return {
    status: "submitted",
    transactionID: responsePayload.transactionID,
    state: responsePayload.state
  };
}

export async function submitDepositWalletCreate(ownerAddress: string) {
  const gate = assertLiveTopUpMutationAllowed();
  if (gate.status !== "ready") {
    return { status: "blocked" as const, code: gate.reason };
  }

  const owner = normalizeEvmAddress(ownerAddress);
  if (!owner) {
    return { status: "blocked" as const, code: "missing_wallet" };
  }

  return submitRelayerPayload({
    type: "WALLET-CREATE",
    from: owner,
    to: gate.config.depositWalletFactoryAddress
  });
}

export async function submitSignedDepositWalletBatch(payload: DepositWalletBatchRequest) {
  return submitRelayerPayload(payload);
}
