import "server-only";
import { z } from "zod";

const serverEnvSchema = z.object({
  POLYMARKET_GAMMA_API_BASE_URL: z
    .string()
    .url()
    .default("https://gamma-api.polymarket.com"),
  POLYMARKET_CLOB_API_BASE_URL: z
    .string()
    .url()
    .default("https://clob.polymarket.com"),
  POLYMARKET_DATA_API_BASE_URL: z
    .string()
    .url()
    .default("https://data-api.polymarket.com"),
  POLYMARKET_MARKET_CACHE_TTL_MS: z.coerce.number().int().positive().default(60_000),
  POLYMARKET_PUBLIC_LIVE_ENABLED: z
    .enum(["true", "false"])
    .default("false")
    .transform((value) => value === "true"),
  POLYMARKET_DRY_RUN_ENABLED: z
    .enum(["true", "false"])
    .default("false")
    .transform((value) => value === "true"),
  POLYMARKET_BUILDER_CODE: z.string().optional(),
  POLYMARKET_OPERATOR_CONFIRM_LIVE_TRADING: z.string().optional(),
  POLYMARKET_OFFICIAL_FUNDING_URL: z
    .string()
    .url()
    .default("https://polymarket.com/portfolio"),
  POLYMARKET_COLLATERAL_SETUP_ENABLED: z
    .enum(["true", "false"])
    .default("false")
    .transform((value) => value === "true"),
  POLYGON_RPC_URL: z.string().url().optional()
});

export type ServerEnv = z.infer<typeof serverEnvSchema>;

export function getServerEnv(): ServerEnv {
  return serverEnvSchema.parse({
    POLYMARKET_GAMMA_API_BASE_URL: process.env.POLYMARKET_GAMMA_API_BASE_URL,
    POLYMARKET_CLOB_API_BASE_URL: process.env.POLYMARKET_CLOB_API_BASE_URL,
    POLYMARKET_DATA_API_BASE_URL: process.env.POLYMARKET_DATA_API_BASE_URL,
    POLYMARKET_MARKET_CACHE_TTL_MS: process.env.POLYMARKET_MARKET_CACHE_TTL_MS,
    POLYMARKET_PUBLIC_LIVE_ENABLED: process.env.POLYMARKET_PUBLIC_LIVE_ENABLED,
    POLYMARKET_DRY_RUN_ENABLED: process.env.POLYMARKET_DRY_RUN_ENABLED,
    POLYMARKET_BUILDER_CODE: process.env.POLYMARKET_BUILDER_CODE,
    POLYMARKET_OPERATOR_CONFIRM_LIVE_TRADING:
      process.env.POLYMARKET_OPERATOR_CONFIRM_LIVE_TRADING,
    POLYMARKET_OFFICIAL_FUNDING_URL: process.env.POLYMARKET_OFFICIAL_FUNDING_URL,
    POLYMARKET_COLLATERAL_SETUP_ENABLED:
      process.env.POLYMARKET_COLLATERAL_SETUP_ENABLED,
    POLYGON_RPC_URL: process.env.POLYGON_RPC_URL
  });
}
