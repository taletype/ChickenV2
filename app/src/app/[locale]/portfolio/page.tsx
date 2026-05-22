import { PortfolioView } from "@/components/prediction-ui/portfolio/portfolio-view";
import { buildFundingPanelViewModel } from "@/features/prediction/funding/adapter";
import { buildPortfolioViewModel } from "@/features/prediction/portfolio/adapter";

export default async function PortfolioPage({
  searchParams
}: {
  searchParams: Promise<{ address?: string }>;
}) {
  const query = await searchParams;
  const portfolio = await buildPortfolioViewModel({ address: query.address });
  const funding = buildFundingPanelViewModel(query.address);

  return <PortfolioView portfolio={portfolio} funding={funding} />;
}
