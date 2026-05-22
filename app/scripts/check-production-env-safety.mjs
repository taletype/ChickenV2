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

console.log("production env safety check passed");
