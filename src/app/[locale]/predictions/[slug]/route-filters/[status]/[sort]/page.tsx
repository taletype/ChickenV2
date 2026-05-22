import { PredictionResultsPage } from "@/components/prediction-ui/discovery/prediction-results-page";

export default async function PredictionResultsFilteredRoute({
  params
}: {
  params: Promise<{ locale: string; slug: string; status: string; sort: string }>;
}) {
  const { locale, slug, status, sort } = await params;

  return (
    <PredictionResultsPage
      locale={locale}
      slug={slug}
      status={status}
      sort={sort}
    />
  );
}
