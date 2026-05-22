import type { PredictionChartViewModel } from "@/features/prediction/types";
import { StatusBanner } from "./status-banner";

function normalizeChartPoints(points: PredictionChartViewModel["points"]) {
  const minTs = Math.min(...points.map((point) => point.timestamp));
  const maxTs = Math.max(...points.map((point) => point.timestamp));
  const minPrice = Math.min(...points.map((point) => point.price));
  const maxPrice = Math.max(...points.map((point) => point.price));
  const tsRange = Math.max(maxTs - minTs, 1);
  const priceRange = Math.max(maxPrice - minPrice, 0.01);

  return points.map((point) => {
    const x = ((point.timestamp - minTs) / tsRange) * 100;
    const y = 100 - ((point.price - minPrice) / priceRange) * 82 - 9;
    return { x, y };
  });
}

function pathFromPoints(points: ReturnType<typeof normalizeChartPoints>) {
  if (points.length < 2) {
    return "";
  }

  return points
    .map(
      (point, index) =>
        `${index === 0 ? "M" : "L"} ${point.x.toFixed(2)} ${point.y.toFixed(2)}`
    )
    .join(" ");
}

export function PriceChart({ chart }: { chart: PredictionChartViewModel }) {
  if (chart.status !== "ready") {
    return (
      <div className="overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--card)] p-4">
        <StatusBanner status={chart.status}>
          {chart.status === "unavailable"
            ? `Chart data is unavailable${chart.error ? `: ${chart.error}` : "."}`
            : "No live chart history is available for this market."}
        </StatusBanner>
      </div>
    );
  }

  const normalizedPoints = normalizeChartPoints(chart.points);
  const chartPath = pathFromPoints(normalizedPoints);
  const latestPoint = normalizedPoints.at(-1);
  const latestLabel =
    chart.latestPrice === null ? "--" : `${Math.round(chart.latestPrice * 100)}% chance`;

  return (
    <section className="overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--card)] p-4 shadow-[var(--panel-shadow)]">
      <div className="mb-4 flex flex-row items-end justify-between gap-3">
        <div className="space-y-1">
          <div className="text-xs font-semibold text-[var(--muted-foreground)]">
            Price history
          </div>
          <div className="text-2xl font-semibold leading-none tabular-nums text-[var(--primary)]">
            {latestLabel}
          </div>
        </div>
        <div className="hidden rounded-md bg-[var(--muted)] px-3 py-2 text-xs font-semibold text-[var(--muted-foreground)] sm:block">
          Live Polymarket feed
        </div>
      </div>
      <svg
        viewBox="0 0 100 100"
        className="h-80 w-full overflow-visible"
        role="img"
        aria-label="Market price history"
        preserveAspectRatio="none"
      >
        {[20, 40, 60, 80].map((y) => (
          <line
            key={y}
            x1="0"
            x2="100"
            y1={y}
            y2={y}
            stroke="var(--border)"
            strokeWidth="0.8"
            vectorEffect="non-scaling-stroke"
          />
        ))}
        <path
          d={chartPath}
          fill="none"
          stroke="var(--primary)"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2.4"
          vectorEffect="non-scaling-stroke"
        />
        {latestPoint ? (
          <circle
            cx={latestPoint.x}
            cy={latestPoint.y}
            r="1.4"
            fill="var(--primary)"
            vectorEffect="non-scaling-stroke"
          />
        ) : null}
      </svg>
    </section>
  );
}
