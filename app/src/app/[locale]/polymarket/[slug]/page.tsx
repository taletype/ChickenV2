import { MarketDetailLayout } from "@/components/prediction-ui/market-detail-layout";
import { buildPredictionChartViewModel } from "@/features/prediction/chart/adapter";
import { buildMarketDetailViewModel } from "@/features/prediction/market-detail/adapter";
import { buildTradeTicketViewModel } from "@/features/prediction/trade-ticket/adapter";
import { buildLiveTopUpFundingSnapshot } from "@/lib/polymarket/live-topup-status";

export default async function PolymarketMarketPage({
  params,
  searchParams
}: {
  params: Promise<{ locale: string; slug: string }>;
  searchParams: Promise<{ address?: string }>;
}) {
  const [{ locale, slug }, query] = await Promise.all([params, searchParams]);
  const detail = await buildMarketDetailViewModel({ locale, slug });
  const funding = await buildLiveTopUpFundingSnapshot({
    address: query.address,
    requiredAmount: 1
  });
  const ticket = buildTradeTicketViewModel({ market: detail.market, funding });
  const chart = await buildPredictionChartViewModel(ticket.selectedTokenId);

  return <MarketDetailLayout detail={detail} chart={chart} ticket={ticket} locale={locale} />;
}
