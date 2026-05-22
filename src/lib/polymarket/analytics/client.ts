import "server-only";
import { dataApiUrl, fetchJson } from "../endpoints";

export async function fetchPolymarketDataApi<T>(
  path: string,
  params: Record<string, string | number | boolean | null | undefined>
) {
  return fetchJson<T>(dataApiUrl(path, params), {
    cache: "no-store",
    timeoutMs: 10_000
  });
}
