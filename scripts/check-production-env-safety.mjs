const publicSecrets = Object.keys(process.env).filter(
  (key) =>
    key.startsWith("NEXT_PUBLIC_") &&
    /(SECRET|PRIVATE|PASSPHRASE|API_KEY|CLOB)/i.test(key)
);

if (publicSecrets.length > 0) {
  console.error(`server secret exposed through NEXT_PUBLIC env: ${publicSecrets.join(", ")}`);
  process.exit(1);
}

if (
  process.env.POLYMARKET_PUBLIC_LIVE_ENABLED === "true" &&
  process.env.POLYMARKET_OPERATOR_CONFIRM_LIVE_TRADING !== "I_UNDERSTAND_REAL_ORDERS"
) {
  console.error("live trading enabled without explicit operator confirmation");
  process.exit(1);
}

const liveTopUpEnabled = process.env.POLYMARKET_LIVE_TOP_UP_ENABLED === "true";
const liveTopUpPaused = process.env.POLYMARKET_LIVE_TOP_UP_KILL_SWITCH === "true";

if (liveTopUpEnabled && !liveTopUpPaused) {
  const required = [
    "RELAYER_URL",
    "BUILDER_API_KEY",
    "BUILDER_SECRET",
    "BUILDER_PASS_PHRASE",
    "CLOB_API_KEY",
    "CLOB_SECRET",
    "CLOB_PASS_PHRASE",
    "CLOB_API_URL",
    "POLYGON_RPC_URL",
    "PUSD_ADDRESS",
    "DEPOSIT_WALLET_FACTORY_ADDRESS"
  ];
  const missing = required.filter((name) => !process.env[name]?.trim());
  if (missing.length > 0) {
    console.error(`live top-up enabled without required env: ${missing.join(", ")}`);
    process.exit(1);
  }
}

console.log("production env safety check passed");
