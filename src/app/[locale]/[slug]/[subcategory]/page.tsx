import type { Route } from "next";
import { redirect } from "next/navigation";
import type { PredictionCategory } from "@/lib/polymarket/categories";
import { PREDICTION_CATEGORIES } from "@/lib/polymarket/categories";
import {
  buildLocalizedPolymarketFeedPath,
  normalizePredictionSearchSlug
} from "@/features/prediction/routes";

export default async function RootSubcategoryPage({
  params
}: {
  params: Promise<{ locale: string; slug: string; subcategory: string }>;
}) {
  const { locale, slug, subcategory } = await params;
  const normalizedCategory = slug.trim().toLowerCase();
  const search = normalizePredictionSearchSlug(subcategory);
  const category = PREDICTION_CATEGORIES.includes(normalizedCategory as PredictionCategory)
    ? normalizedCategory as PredictionCategory
    : undefined;

  return redirect(
    buildLocalizedPolymarketFeedPath(locale, {
      category,
      search: category ? search : normalizePredictionSearchSlug(`${slug} ${subcategory}`)
    }) as Route
  );
}
