import { readFile } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const requiredFiles = [
  "src/lib/polymarket/live-submit-guards.ts",
  "src/lib/polymarket/liveTradingReadiness.ts",
  "src/app/api/polymarket/orders/submit/route.ts",
  "src/app/api/polymarket/orders/prepare/route.ts",
  "src/lib/polymarket/order-validation.ts",
  "src/lib/polymarket/sdk-first/index.ts",
  "src/lib/polymarket/server-order-market.ts",
  "src/lib/polymarket/l2-credentials.ts",
  "src/lib/polymarket/live-order-rate-limits.ts",
  "src/lib/polymarket/order-attempts.ts",
  "src/lib/polymarket/live-trading-audit.ts"
];
const requiredTokens = [
  "POLYMARKET_PUBLIC_LIVE_ENABLED",
  "POLYMARKET_LIVE_SUBMIT_ENABLED",
  "POLYMARKET_LIVE_TRADING_KILL_SWITCH",
  "POLYMARKET_OPERATOR_CONFIRM_LIVE_TRADING",
  "builder_code_missing",
  "live_trading_disabled",
  "missing_l2_credentials",
  "signed_order_identity_mismatch",
  "signed_submit_adapter_not_configured",
  "validatePolymarketOrderIntent",
  "resolveCanonicalPolymarketOrderMarket",
  "redactPolymarketLiveTradingMetadata",
  "buildPolymarketLiveSubmitIdempotencyHash",
  "assertPolymarketLiveOrderRateLimit"
];

const corpus = (
  await Promise.all(
    requiredFiles.map((file) => readFile(path.join(root, file), "utf8"))
  )
).join("\n");

const missing = requiredTokens.filter((token) => !corpus.includes(token));

if (missing.length > 0) {
  console.error(`live trading safety tokens missing: ${missing.join(", ")}`);
  process.exit(1);
}

console.log("live trading safety check passed");
