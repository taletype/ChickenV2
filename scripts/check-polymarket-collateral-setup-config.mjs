if (
  process.env.POLYMARKET_COLLATERAL_SETUP_ENABLED === "true" &&
  !process.env.POLYGON_RPC_URL
) {
  console.error("collateral setup enabled without POLYGON_RPC_URL");
  process.exit(1);
}

if (
  process.env.POLYMARKET_LIVE_TOP_UP_ENABLED === "true" &&
  process.env.POLYMARKET_LIVE_TOP_UP_KILL_SWITCH !== "true"
) {
  const required = [
    "POLYGON_RPC_URL",
    "PUSD_ADDRESS",
    "DEPOSIT_WALLET_FACTORY_ADDRESS"
  ];
  const missing = required.filter((name) => !process.env[name]?.trim());
  if (missing.length > 0) {
    console.error(`live top-up collateral config missing: ${missing.join(", ")}`);
    process.exit(1);
  }
}

console.log("collateral setup config check passed");
