export function decimalPlaces(value: number) {
  const [, fraction = ""] = String(value).split(".");
  return fraction.length;
}

export function getCanonicalTickSize(tickSize: number | null | undefined) {
  if (!tickSize || !Number.isFinite(tickSize) || tickSize <= 0) {
    return 0.01;
  }

  return tickSize;
}

export function snapPriceToPolymarketTick(price: number, tickSize: number) {
  const canonical = getCanonicalTickSize(tickSize);
  const places = decimalPlaces(canonical);
  return Number((Math.round(price / canonical) * canonical).toFixed(places));
}

export function isPriceAlignedToTick(price: number, tickSize: number) {
  const snapped = snapPriceToPolymarketTick(price, tickSize);
  return Math.abs(snapped - price) < 1e-9;
}
