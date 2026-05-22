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
  POLYMARKET_LIVE_TOP_UP_ENABLED: z
    .enum(["true", "false"])
    .default("false")
    .transform((value) => value === "true"),
  POLYMARKET_LIVE_TOP_UP_KILL_SWITCH: z
    .enum(["true", "false"])
    .default("false")
    .transform((value) => value === "true"),
  RELAYER_URL: z.string().url().optional(),
  BUILDER_API_KEY: z.string().optional(),
  BUILDER_SECRET: z.string().optional(),
  BUILDER_PASS_PHRASE: z.string().optional(),
  CLOB_API_KEY: z.string().optional(),
  CLOB_SECRET: z.string().optional(),
  CLOB_PASS_PHRASE: z.string().optional(),
  CLOB_API_URL: z.string().url().optional(),
  POLYGON_RPC_URL: z.string().url().optional(),
  PUSD_ADDRESS: z.string().optional(),
  DEPOSIT_WALLET_FACTORY_ADDRESS: z.string().optional(),
  DEPOSIT_WALLET_IMPLEMENTATION_ADDRESS: z.string().optional()
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
    POLYMARKET_LIVE_TOP_UP_ENABLED: process.env.POLYMARKET_LIVE_TOP_UP_ENABLED,
    POLYMARKET_LIVE_TOP_UP_KILL_SWITCH:
      process.env.POLYMARKET_LIVE_TOP_UP_KILL_SWITCH,
    RELAYER_URL: process.env.RELAYER_URL,
    BUILDER_API_KEY: process.env.BUILDER_API_KEY,
    BUILDER_SECRET: process.env.BUILDER_SECRET,
    BUILDER_PASS_PHRASE: process.env.BUILDER_PASS_PHRASE,
    CLOB_API_KEY: process.env.CLOB_API_KEY,
    CLOB_SECRET: process.env.CLOB_SECRET,
    CLOB_PASS_PHRASE: process.env.CLOB_PASS_PHRASE,
    CLOB_API_URL: process.env.CLOB_API_URL,
    POLYGON_RPC_URL: process.env.POLYGON_RPC_URL,
    PUSD_ADDRESS: process.env.PUSD_ADDRESS,
    DEPOSIT_WALLET_FACTORY_ADDRESS: process.env.DEPOSIT_WALLET_FACTORY_ADDRESS,
    DEPOSIT_WALLET_IMPLEMENTATION_ADDRESS:
      process.env.DEPOSIT_WALLET_IMPLEMENTATION_ADDRESS
  });
}
