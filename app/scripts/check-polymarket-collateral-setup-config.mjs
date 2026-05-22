if (
  process.env.POLYMARKET_COLLATERAL_SETUP_ENABLED === "true" &&
  !process.env.POLYGON_RPC_URL
) {
  console.error("collateral setup enabled without POLYGON_RPC_URL");
  process.exit(1);
}

console.log("collateral setup config check passed");
