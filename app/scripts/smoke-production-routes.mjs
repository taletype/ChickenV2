const baseUrl = process.env.PRODUCTION_ROUTE_SMOKE_BASE_URL ?? "http://127.0.0.1:3000";
const routes = ["/zh/polymarket", "/en/polymarket", "/zh/portfolio"];
const failures = [];

for (const route of routes) {
  try {
    const response = await fetch(`${baseUrl}${route}`, {
      redirect: "manual"
    });
    if (response.status >= 500) {
      failures.push(`${route} returned ${response.status}`);
    }
  } catch (error) {
    failures.push(`${route} failed: ${error instanceof Error ? error.message : error}`);
  }
}

if (failures.length > 0) {
  console.error(failures.join("\n"));
  process.exit(1);
}

console.log("production route smoke passed");
