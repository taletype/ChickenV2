import { MarketDetailLayout } from "@/components/prediction-ui/market-detail-layout";
import { buildPredictionChartViewModel } from "@/features/prediction/chart/adapter";
import { buildMarketDetailViewModel } from "@/features/prediction/market-detail/adapter";
import { buildTradeTicketViewModel } from "@/features/prediction/trade-ticket/adapter";

export default async function PolymarketMarketPage({
  params
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  const detail = await buildMarketDetailViewModel({ locale, slug });
  const ticket = buildTradeTicketViewModel({ market: detail.market });
  const chart = await buildPredictionChartViewModel(ticket.selectedTokenId);

  return <MarketDetailLayout detail={detail} chart={chart} ticket={ticket} />;
}
