import type {
  PredictionChartViewModel,
  PredictionMarketDetailViewModel,
  PredictionTradeTicketViewModel
} from "@/features/prediction/types";
import { MarketHeader } from "./market-header";
import { OutcomeList } from "./outcome-list";
import { PriceChart } from "./price-chart";
import { StatusBanner } from "./status-banner";
import { TradeTicket } from "./trade-ticket/trade-ticket";

export function MarketDetailLayout({
  detail,
  chart,
  ticket
}: {
  detail: PredictionMarketDetailViewModel;
  chart: PredictionChartViewModel;
  ticket: PredictionTradeTicketViewModel;
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
    <div className="app-container grid min-h-screen gap-8 pb-12 lg:grid-cols-[minmax(0,3fr)_21.25rem]">
      <div className="grid gap-6 pb-20 pt-5 md:pb-0">
        <div className="grid gap-3">
          <MarketHeader market={detail.market} />
          <div className="min-h-96 w-full">
            <PriceChart chart={chart} />
          </div>
        </div>

        <div className="grid gap-6">
          <OutcomeList market={detail.market} />
          {detail.description ? (
            <section className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-4">
              <h2 className="text-base font-medium">Rules</h2>
              <p className="mt-3 whitespace-pre-line text-sm leading-6 text-[var(--muted-foreground)]">
                {detail.description}
              </p>
            </section>
          ) : null}
          <div className="lg:hidden">
            <TradeTicket ticket={ticket} outcomes={detail.market.outcomes} />
          </div>
        </div>
      </div>

      <aside className="hidden gap-4 lg:sticky lg:top-[9.5rem] lg:grid lg:max-h-[calc(100vh-7rem)] lg:self-start lg:overflow-y-auto">
        <div className="grid gap-6">
          <TradeTicket ticket={ticket} outcomes={detail.market.outcomes} />
          <p className="border border-dashed border-[var(--border)] p-3 text-xs leading-5 text-[var(--muted-foreground)]">
            Trading actions remain guarded by V2 wallet, funding, and server-side
            checks before any order can be submitted.
          </p>
        </div>
      </aside>

    </div>
  );
}
