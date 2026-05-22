const baseUrl = process.env.POLYMARKET_DATA_SMOKE_BASE_URL;

async function checkAppRoute() {
  const response = await fetch(`${baseUrl}/api/polymarket/markets?limit=3&refresh=true`);
  if (!response.ok) {
    throw new Error(`app route returned ${response.status}`);
  }
  const json = await response.json();
  if (!Array.isArray(json.data)) {
    throw new Error("app route did not return a data array");
  }
  console.log(`polymarket app data route returned ${json.data.length} markets`);
}

async function checkGammaDirect() {
  const url =
    "https://gamma-api.polymarket.com/markets?active=true&closed=false&archived=false&limit=3";
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`gamma returned ${response.status}`);
  }
  const json = await response.json();
  if (!Array.isArray(json)) {
    throw new Error("gamma response did not return an array");
  }
  console.log(`polymarket gamma returned ${json.length} markets`);
}

try {
  if (baseUrl) {
    await checkAppRoute();
  } else {
    await checkGammaDirect();
  }
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
}
