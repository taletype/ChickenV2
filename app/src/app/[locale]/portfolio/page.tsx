import { PortfolioView } from "@/components/prediction-ui/portfolio/portfolio-view";
import { buildFundingPanelViewModel } from "@/features/prediction/funding/adapter";
import { buildPortfolioViewModel } from "@/features/prediction/portfolio/adapter";

export default async function PortfolioPage({
  params,
  searchParams
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ address?: string }>;
}) {
  const [{ locale }, query] = await Promise.all([params, searchParams]);
  const [portfolio, funding] = await Promise.all([
    buildPortfolioViewModel({ address: query.address }),
    buildFundingPanelViewModel(query.address)
  ]);

  return <PortfolioView portfolio={portfolio} funding={funding} locale={locale} />;
}
