import type {
  PredictionChartViewModel,
  PredictionMarketDetailViewModel,
  PredictionTradeTicketViewModel
} from "@/features/prediction/types";
import { MarketHeader } from "./market-header";
import { MarketDetailTabs } from "./market-detail-tabs";
import { OutcomeList } from "./outcome-list";
import { PriceChart } from "./price-chart";
import { StatusBanner } from "./status-banner";
import { TradeTicket } from "./trade-ticket/trade-ticket";

export function MarketDetailLayout({
  detail,
  chart,
  ticket,
  locale
}: {
  detail: PredictionMarketDetailViewModel;
  chart: PredictionChartViewModel;
  ticket: PredictionTradeTicketViewModel;
  locale?: string;
}) {
  if (detail.status !== "ready" || !detail.market) {
    return (
      <div className="app-container py-8">
        <StatusBanner status="unavailable">
          Market detail is unavailable{detail.error ? `: ${detail.error}` : "."}
        </StatusBanner>
      </div>
    );
  }

  return (
    <div className="app-container grid min-h-screen gap-8 pb-12 lg:grid-cols-[minmax(0,1fr)_21.25rem]">
      <div className="grid gap-6 pb-20 pt-5 md:pb-0">
        <div className="grid gap-3">
          <MarketHeader market={detail.market} />
          <div className="min-h-96 w-full">
            <PriceChart chart={chart} />
          </div>
        </div>

        <div className="grid gap-6">
          <OutcomeList market={detail.market} />
          <div className="lg:hidden">
            <TradeTicket
              ticket={ticket}
              market={detail.market}
              outcomes={detail.market.outcomes}
              locale={locale}
            />
          </div>
          <MarketDetailTabs
            market={detail.market}
            description={detail.description}
            metadata={detail.metadata}
            discussion={detail.discussion}
            activity={detail.activity}
            openOrders={detail.openOrders}
            locale={locale}
          />
        </div>
      </div>

      <aside className="hidden gap-4 lg:sticky lg:top-[9.5rem] lg:grid lg:max-h-[calc(100vh-7rem)] lg:self-start lg:overflow-y-auto">
        <div className="grid gap-6">
          <TradeTicket
            ticket={ticket}
            market={detail.market}
            outcomes={detail.market.outcomes}
            locale={locale}
          />
          <p className="pb-2 text-center text-xs font-medium leading-5 text-[var(--muted-foreground)] lg:-mt-2 lg:pb-0">
            Trading actions remain guarded by V2 wallet, funding, and server-side
            checks before any order can be submitted.
          </p>
        </div>
      </aside>
    </div>
  );
}
