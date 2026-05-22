import type { PredictionMarketCardViewModel } from "@/features/prediction/types";
import { MarketCard } from "./market-card";
import { StatusBanner } from "./status-banner";

export function MarketGrid({
  markets,
  status,
  error
}: {
  markets: PredictionMarketCardViewModel[];
  status: "ready" | "empty" | "unavailable";
  error: string | null;
}) {
  if (status !== "ready") {
    return (
      <StatusBanner status={status}>
        {status === "unavailable"
          ? `Market data is unavailable${error ? `: ${error}` : "."}`
          : "No live markets are available for this filter."}
      </StatusBanner>
    );
  }

  return (
    <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {markets.map((market) => (
        <MarketCard key={market.id} market={market} />
      ))}
    </div>
  );
}
