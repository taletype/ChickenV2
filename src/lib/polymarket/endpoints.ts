import "server-only";
import { getServerEnv } from "@/lib/env/server-env";

type Params = Record<string, string | number | boolean | null | undefined>;

function buildUrl(base: string, path: string, params: Params = {}) {
  const url = new URL(path, base);

  for (const [key, value] of Object.entries(params)) {
    if (value !== null && value !== undefined && value !== "") {
      url.searchParams.set(key, String(value));
    }
  }

  return url;
}

export function gammaUrl(path: string, params?: Params) {
  return buildUrl(getServerEnv().POLYMARKET_GAMMA_API_BASE_URL, path, params);
}

export function clobUrl(path: string, params?: Params) {
  return buildUrl(getServerEnv().POLYMARKET_CLOB_API_BASE_URL, path, params);
}

export function dataApiUrl(path: string, params?: Params) {
  return buildUrl(getServerEnv().POLYMARKET_DATA_API_BASE_URL, path, params);
}

export async function fetchJson<T>(
  url: URL,
  init: RequestInit & { timeoutMs?: number } = {}
): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), init.timeoutMs ?? 12_000);

  try {
    const response = await fetch(url, {
      ...init,
      headers: {
        accept: "application/json",
        ...(init.headers ?? {})
      },
      signal: controller.signal
    });

    if (!response.ok) {
      throw new Error(`upstream_${response.status}`);
    }

    return (await response.json()) as T;
  } finally {
    clearTimeout(timeout);
  }
}
