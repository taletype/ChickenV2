export const PREDICTION_CATEGORIES = [
  "trending",
  "politics",
  "sports",
  "crypto",
  "culture",
  "business"
] as const;

export type PredictionCategory = (typeof PREDICTION_CATEGORIES)[number];

export function normalizePredictionCategory(
  value: string | null | undefined
): PredictionCategory {
  const normalized = value?.toLowerCase();

  if (PREDICTION_CATEGORIES.includes(normalized as PredictionCategory)) {
    return normalized as PredictionCategory;
  }

  return "trending";
}
