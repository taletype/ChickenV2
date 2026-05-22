import { readFile } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const requiredFiles = [
  "src/lib/polymarket/live-submit-guards.ts",
  "src/app/api/polymarket/orders/submit/route.ts",
  "src/lib/polymarket/order-validation.ts"
];
const requiredTokens = [
  "POLYMARKET_PUBLIC_LIVE_ENABLED",
  "POLYMARKET_OPERATOR_CONFIRM_LIVE_TRADING",
  "builder_code_missing",
  "live_trading_disabled",
  "validatePolymarketOrderIntent"
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
