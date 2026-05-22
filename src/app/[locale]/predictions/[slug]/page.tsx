import { PredictionResultsPage } from "@/components/prediction-ui/discovery/prediction-results-page";

export default async function PredictionResultsRoute({
  params,
  searchParams
}: {
  params: Promise<{ locale: string; slug: string }>;
  searchParams: Promise<{ sort?: string }>;
}) {
  const [{ locale, slug }, query] = await Promise.all([params, searchParams]);

  return <PredictionResultsPage locale={locale} slug={slug} sort={query.sort} />;
}
