import "server-only";
import type { ServerEnv } from "@/lib/env/server-env";
import { getServerEnv } from "@/lib/env/server-env";

export type PolymarketApiKeyCredentials = {
  key: string;
  secret: string;
  passphrase: string;
};

export type PolymarketL2CredentialReadiness =
  | {
      status: "ready";
      credentials: PolymarketApiKeyCredentials;
      metadata: {
        keyPresent: true;
        secretPresent: true;
        passphrasePresent: true;
        source: "server_env" | "injected";
      };
    }
  | {
      status: "blocked";
      code: "missing_l2_credentials";
      missing: Array<keyof PolymarketApiKeyCredentials>;
      metadata: {
        keyPresent: boolean;
        secretPresent: boolean;
        passphrasePresent: boolean;
        source: "server_env" | "injected";
      };
    };

function trimmed(value: unknown) {
  return typeof value === "string" && value.trim().length > 0
    ? value.trim()
    : null;
}

export function validatePolymarketApiKeyCredentials(
  value: unknown
): PolymarketApiKeyCredentials | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const candidate = value as Record<string, unknown>;
  const key = trimmed(candidate.key);
  const secret = trimmed(candidate.secret);
  const passphrase = trimmed(candidate.passphrase);

  if (!key || !secret || !passphrase) {
    return null;
  }

  return { key, secret, passphrase };
}

function credentialsFromEnv(env: ServerEnv): PolymarketApiKeyCredentials | null {
  const key = trimmed(env.CLOB_API_KEY) ?? trimmed(env.POLYMARKET_CLOB_API_KEY);
  const secret =
    trimmed(env.CLOB_SECRET) ?? trimmed(env.POLYMARKET_CLOB_API_SECRET);
  const passphrase =
    trimmed(env.CLOB_PASS_PHRASE) ??
    trimmed(env.POLYMARKET_CLOB_API_PASSPHRASE);

  if (!key || !secret || !passphrase) {
    return null;
  }

  return { key, secret, passphrase };
}

export function getPolymarketL2CredentialReadiness(
  options: {
    credentials?: PolymarketApiKeyCredentials | null;
    env?: ServerEnv;
  } = {}
): PolymarketL2CredentialReadiness {
  const source = options.credentials ? "injected" : "server_env";
  const credentials =
    options.credentials ?? credentialsFromEnv(options.env ?? getServerEnv());
  const metadata = {
    keyPresent: Boolean(credentials?.key),
    secretPresent: Boolean(credentials?.secret),
    passphrasePresent: Boolean(credentials?.passphrase),
    source
  } as const;

  if (credentials) {
    return {
      status: "ready",
      credentials,
      metadata: {
        ...metadata,
        keyPresent: true,
        secretPresent: true,
        passphrasePresent: true
      }
    };
  }

  const missing: Array<keyof PolymarketApiKeyCredentials> = [];
  if (!metadata.keyPresent) {
    missing.push("key");
  }
  if (!metadata.secretPresent) {
    missing.push("secret");
  }
  if (!metadata.passphrasePresent) {
    missing.push("passphrase");
  }

  return {
    status: "blocked",
    code: "missing_l2_credentials",
    missing,
    metadata
  };
}
