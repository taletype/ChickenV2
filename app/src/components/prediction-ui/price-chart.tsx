"use client";

import { useId, useMemo, useRef, useState } from "react";
import type { PointerEvent } from "react";
import type { PredictionChartViewModel } from "@/features/prediction/types";
import type { PolymarketPricePoint } from "@/lib/polymarket/types";
import { StatusBanner } from "./status-banner";

type ChartPoint = PolymarketPricePoint & {
  x: number;
  y: number;
};

type TimeRange = {
  label: string;
  durationMs: number | null;
};

type HoverState = {
  point: ChartPoint;
  plotX: number;
  plotY: number;
};

const TIME_RANGES: TimeRange[] = [
  { label: "1D", durationMs: 24 * 60 * 60 * 1000 },
  { label: "1W", durationMs: 7 * 24 * 60 * 60 * 1000 },
  { label: "1M", durationMs: 30 * 24 * 60 * 60 * 1000 },
  { label: "All", durationMs: null }
];

const SVG_WIDTH = 1000;
const SVG_HEIGHT = 420;
const CHART_MARGIN = {
  top: 28,
  right: 62,
  bottom: 44,
  left: 12
};
const PLOT_WIDTH = SVG_WIDTH - CHART_MARGIN.left - CHART_MARGIN.right;
const PLOT_HEIGHT = SVG_HEIGHT - CHART_MARGIN.top - CHART_MARGIN.bottom;

function formatChance(price: number | null | undefined) {
  if (typeof price !== "number" || !Number.isFinite(price)) {
    return "--";
  }

  const percentage = price * 100;

  if (percentage > 0 && percentage < 1) {
    return "<1% chance";
  }

  return `${Math.round(percentage)}% chance`;
}

function formatTooltipChance(price: number) {
  return `${(price * 100).toFixed(1).replace(/\.0$/, "")}%`;
}

function formatAxisChance(price: number, domain: { min: number; max: number }) {
  const percentage = price * 100;
  const domainSpan = (domain.max - domain.min) * 100;

  if (domainSpan <= 5) {
    return `${percentage.toFixed(1).replace(/\.0$/, "")}%`;
  }

  return `${Math.round(percentage)}%`;
}

function formatDateLabel(timestamp: number) {
  return new Date(timestamp).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit"
  });
}

function formatAxisDate(timestamp: number, totalDurationMs: number) {
  const date = new Date(timestamp);

  if (totalDurationMs <= 48 * 60 * 60 * 1000) {
    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit"
    });
  }

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric"
  });
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function normalizeTimestamp(timestamp: number) {
  return timestamp < 10_000_000_000 ? timestamp * 1000 : timestamp;
}

function dedupeAndSortPoints(points: PredictionChartViewModel["points"]) {
  const pointsByTimestamp = new Map<number, PolymarketPricePoint>();

  points.forEach((point) => {
    const timestamp = normalizeTimestamp(Number(point.timestamp));
    const price = Number(point.price);

    if (!Number.isFinite(timestamp) || !Number.isFinite(price)) {
      return;
    }

    pointsByTimestamp.set(timestamp, {
      timestamp,
      price: clamp(price, 0, 1)
    });
  });

  return Array.from(pointsByTimestamp.values()).sort(
    (first, second) => first.timestamp - second.timestamp
  );
}

function getVisiblePoints(points: PolymarketPricePoint[], activeRange: TimeRange) {
  if (activeRange.durationMs === null || points.length === 0) {
    return points;
  }

  const latestTimestamp = points.at(-1)?.timestamp;

  if (!latestTimestamp) {
    return points;
  }

  const cutoff = latestTimestamp - activeRange.durationMs;

  return points.filter((point) => point.timestamp >= cutoff);
}

function buildYDomain(points: PolymarketPricePoint[]) {
  if (points.length === 0) {
    return { min: 0, max: 1 };
  }

  const prices = points.map((point) => point.price);
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);
  const span = Math.max(maxPrice - minPrice, 0.02);
  const padding = span * 0.18;
  const min = clamp(minPrice - padding, 0, 1);
  const max = clamp(maxPrice + padding, 0, 1);

  if (max - min < 0.02) {
    return {
      min: clamp(min - 0.01, 0, 1),
      max: clamp(max + 0.01, 0, 1)
    };
  }

  return { min, max };
}

function buildScaledPoints(points: PolymarketPricePoint[]) {
  if (points.length === 0) {
    return [];
  }

  const minTimestamp = points[0]?.timestamp ?? 0;
  const maxTimestamp = points.at(-1)?.timestamp ?? minTimestamp + 1;
  const timestampRange = Math.max(maxTimestamp - minTimestamp, 1);
  const yDomain = buildYDomain(points);
  const priceRange = Math.max(yDomain.max - yDomain.min, 0.01);

  return points.map((point) => {
    const x = ((point.timestamp - minTimestamp) / timestampRange) * PLOT_WIDTH;
    const y = PLOT_HEIGHT - ((point.price - yDomain.min) / priceRange) * PLOT_HEIGHT;

    return {
      ...point,
      x,
      y
    };
  });
}

function pathFromPoints(points: ChartPoint[]) {
  if (points.length < 2) {
    return "";
  }

  return points
    .map((point, index) => {
      const command = index === 0 ? "M" : "L";
      return `${command} ${point.x.toFixed(2)} ${point.y.toFixed(2)}`;
    })
    .join(" ");
}

function areaPathFromPoints(points: ChartPoint[]) {
  const linePath = pathFromPoints(points);

  if (!linePath || points.length < 2) {
    return "";
  }

  const firstPoint = points[0];
  const lastPoint = points.at(-1);

  if (!firstPoint || !lastPoint) {
    return "";
  }

  return `${linePath} L ${lastPoint.x.toFixed(2)} ${PLOT_HEIGHT} L ${firstPoint.x.toFixed(
    2
  )} ${PLOT_HEIGHT} Z`;
}

function buildXTicks(points: PolymarketPricePoint[]) {
  const firstPoint = points[0];
  const lastPoint = points.at(-1);

  if (!firstPoint || !lastPoint) {
    return [];
  }

  const middleTimestamp = firstPoint.timestamp + (lastPoint.timestamp - firstPoint.timestamp) / 2;

  return [firstPoint.timestamp, middleTimestamp, lastPoint.timestamp];
}

function buildYTicks(points: PolymarketPricePoint[]) {
  const domain = buildYDomain(points);
  const step = (domain.max - domain.min) / 4;

  return Array.from({ length: 5 }, (_, index) => domain.min + step * index).reverse();
}

function findNearestPoint(points: ChartPoint[], plotX: number) {
  if (points.length === 0) {
    return null;
  }

  return points.reduce((nearest, point) => {
    const currentDistance = Math.abs(point.x - plotX);
    const nearestDistance = Math.abs(nearest.x - plotX);

    return currentDistance < nearestDistance ? point : nearest;
  }, points[0]);
}

function EmptyChartState({
  status,
  error
}: {
  status: PredictionChartViewModel["status"];
  error: string | null;
}) {
  return (
    <section className="overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--card)] p-4 shadow-[var(--panel-shadow)]">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div className="space-y-1">
          <div className="text-xs font-semibold text-[var(--muted-foreground)]">
            Price history
          </div>
          <div className="text-2xl font-semibold leading-none tabular-nums text-[var(--foreground)]">
            -- chance
          </div>
        </div>
        <div className="rounded-md bg-[var(--muted)] px-3 py-2 text-xs font-semibold text-[var(--muted-foreground)]">
          Live Polymarket feed
        </div>
      </div>
      <div className="flex min-h-[18rem] items-center justify-center rounded-lg border border-dashed border-[var(--border)] bg-[var(--muted)]/60 p-4">
        <StatusBanner status={status}>
          {status === "unavailable"
            ? `Chart data is unavailable${error ? `: ${error}` : "."}`
            : "No live chart history is available for this market."}
        </StatusBanner>
      </div>
    </section>
  );
}

export function PriceChart({ chart }: { chart: PredictionChartViewModel }) {
  const gradientId = useId().replace(/:/g, "");
  const chartShellRef = useRef<HTMLDivElement | null>(null);
  const [activeRangeLabel, setActiveRangeLabel] = useState("1W");
  const [hoverState, setHoverState] = useState<HoverState | null>(null);
  const activeRange =
    TIME_RANGES.find((range) => range.label === activeRangeLabel) ?? TIME_RANGES[1];

  const sortedPoints = useMemo(() => dedupeAndSortPoints(chart.points), [chart.points]);
  const visiblePoints = useMemo(
    () => getVisiblePoints(sortedPoints, activeRange),
    [activeRange, sortedPoints]
  );
  const scaledPoints = useMemo(() => buildScaledPoints(visiblePoints), [visiblePoints]);
  const linePath = useMemo(() => pathFromPoints(scaledPoints), [scaledPoints]);
  const areaPath = useMemo(() => areaPathFromPoints(scaledPoints), [scaledPoints]);
  const xTicks = useMemo(() => buildXTicks(visiblePoints), [visiblePoints]);
  const yTicks = useMemo(() => buildYTicks(visiblePoints), [visiblePoints]);
  const yDomain = useMemo(() => buildYDomain(visiblePoints), [visiblePoints]);
  const latestPoint = visiblePoints.at(-1) ?? sortedPoints.at(-1) ?? null;
  const displayPoint = hoverState?.point ?? latestPoint;
  const latestLabel = formatChance(displayPoint?.price ?? chart.latestPrice);
  const totalDurationMs =
    visiblePoints.length > 1
      ? (visiblePoints.at(-1)?.timestamp ?? 0) - (visiblePoints[0]?.timestamp ?? 0)
      : 0;

  if (chart.status !== "ready") {
    return <EmptyChartState status={chart.status} error={chart.error} />;
  }

  if (visiblePoints.length < 2 || scaledPoints.length < 2) {
    return (
      <section className="overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--card)] p-4 shadow-[var(--panel-shadow)]">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <div className="space-y-1">
            <div className="text-xs font-semibold text-[var(--muted-foreground)]">
              Price history
            </div>
            <div className="text-2xl font-semibold leading-none tabular-nums text-[var(--primary)]">
              {formatChance(sortedPoints.at(-1)?.price ?? chart.latestPrice)}
            </div>
          </div>
          <TimeRangeControls
            activeRangeLabel={activeRangeLabel}
            onRangeChange={setActiveRangeLabel}
          />
        </div>
        <div className="flex min-h-[18rem] items-center justify-center rounded-lg border border-dashed border-[var(--border)] bg-[var(--muted)]/60 p-4">
          <StatusBanner status="empty">
            Not enough live chart history is available for this range.
          </StatusBanner>
        </div>
      </section>
    );
  }

  function handlePointerMove(event: PointerEvent<SVGRectElement>) {
    const shell = chartShellRef.current;

    if (!shell) {
      return;
    }

    const svgBounds = event.currentTarget.getBoundingClientRect();
    const xRatio = (event.clientX - svgBounds.left) / Math.max(svgBounds.width, 1);
    const plotX = clamp(xRatio * PLOT_WIDTH, 0, PLOT_WIDTH);
    const nearestPoint = findNearestPoint(scaledPoints, plotX);

    if (!nearestPoint) {
      return;
    }

    setHoverState({
      point: nearestPoint,
      plotX: nearestPoint.x,
      plotY: nearestPoint.y
    });
  }

  function handlePointerLeave() {
    setHoverState(null);
  }

  const markerPoint = hoverState?.point ?? scaledPoints.at(-1);
  const tooltipSide = hoverState && hoverState.plotX > PLOT_WIDTH * 0.72 ? "left" : "right";

  return (
    <section className="overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--card)] p-4 shadow-[var(--panel-shadow)]">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div className="space-y-1">
          <div className="text-xs font-semibold text-[var(--muted-foreground)]">
            Price history
          </div>
          <div className="text-2xl font-semibold leading-none tabular-nums text-[var(--primary)]">
            {latestLabel}
          </div>
        </div>
        <div className="flex flex-wrap items-center justify-end gap-2">
          <div className="hidden rounded-md bg-[var(--muted)] px-3 py-2 text-xs font-semibold text-[var(--muted-foreground)] sm:block">
            Live Polymarket feed
          </div>
          <TimeRangeControls
            activeRangeLabel={activeRangeLabel}
            onRangeChange={setActiveRangeLabel}
          />
        </div>
      </div>

      <div ref={chartShellRef} className="relative min-h-[18rem] sm:min-h-[22rem]">
        <svg
          viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`}
          className="h-[18rem] w-full overflow-visible sm:h-[22rem] lg:h-[24rem]"
          role="img"
          aria-label="Market price history"
          preserveAspectRatio="none"
          onPointerLeave={handlePointerLeave}
        >
          <defs>
            <linearGradient id={`${gradientId}-area`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.18" />
              <stop offset="100%" stopColor="var(--primary)" stopOpacity="0" />
            </linearGradient>
          </defs>

          <g transform={`translate(${CHART_MARGIN.left} ${CHART_MARGIN.top})`}>
            {yTicks.map((tick) => {
              const y =
                PLOT_HEIGHT -
                ((tick - yDomain.min) / Math.max(yDomain.max - yDomain.min, 0.01)) * PLOT_HEIGHT;

              return (
                <g key={`y-${tick.toFixed(4)}`}>
                  <line
                    x1="0"
                    x2={PLOT_WIDTH}
                    y1={y}
                    y2={y}
                    stroke="var(--border)"
                    strokeDasharray="3 7"
                    strokeWidth="1"
                    opacity="0.9"
                    vectorEffect="non-scaling-stroke"
                  />
                  <text
                    x={PLOT_WIDTH + 14}
                    y={y + 4}
                    className="fill-[var(--muted-foreground)] text-[11px] font-medium"
                  >
                    {formatAxisChance(tick, yDomain)}
                  </text>
                </g>
              );
            })}

            {xTicks.map((tick) => {
              const firstTimestamp = visiblePoints[0]?.timestamp ?? tick;
              const lastTimestamp = visiblePoints.at(-1)?.timestamp ?? firstTimestamp + 1;
              const x =
                ((tick - firstTimestamp) / Math.max(lastTimestamp - firstTimestamp, 1)) *
                PLOT_WIDTH;

              return (
                <text
                  key={`x-${tick}`}
                  x={x}
                  y={PLOT_HEIGHT + 30}
                  textAnchor={x < PLOT_WIDTH * 0.1 ? "start" : x > PLOT_WIDTH * 0.9 ? "end" : "middle"}
                  className="fill-[var(--muted-foreground)] text-[11px] font-medium"
                >
                  {formatAxisDate(tick, totalDurationMs)}
                </text>
              );
            })}

            {areaPath ? (
              <path d={areaPath} fill={`url(#${gradientId}-area)`} pointerEvents="none" />
            ) : null}
            <path
              d={linePath}
              fill="none"
              stroke="var(--primary)"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="3"
              vectorEffect="non-scaling-stroke"
              pointerEvents="none"
            />

            {hoverState ? (
              <line
                x1={hoverState.plotX}
                x2={hoverState.plotX}
                y1="0"
                y2={PLOT_HEIGHT}
                stroke="var(--foreground)"
                strokeDasharray="4 7"
                strokeOpacity="0.42"
                strokeWidth="1"
                vectorEffect="non-scaling-stroke"
                pointerEvents="none"
              />
            ) : null}

            {markerPoint ? (
              <g transform={`translate(${markerPoint.x} ${markerPoint.y})`} pointerEvents="none">
                <circle
                  r="9"
                  fill="var(--primary)"
                  fillOpacity="0.16"
                  vectorEffect="non-scaling-stroke"
                />
                <circle
                  r="4"
                  fill="var(--card)"
                  stroke="var(--primary)"
                  strokeWidth="2.5"
                  vectorEffect="non-scaling-stroke"
                />
              </g>
            ) : null}

            <rect
              x="0"
              y="0"
              width={PLOT_WIDTH}
              height={PLOT_HEIGHT}
              fill="transparent"
              onPointerMove={handlePointerMove}
            />
          </g>
        </svg>

        {hoverState ? (
          <div
            className="pointer-events-none absolute top-8 z-10 rounded-lg border border-[var(--border)] bg-[var(--card)] px-3 py-2 text-xs shadow-[0_18px_44px_-28px_rgba(15,23,42,0.62)]"
            style={{
              left: `${
                ((CHART_MARGIN.left + hoverState.plotX) / SVG_WIDTH) * 100
              }%`,
              transform:
                tooltipSide === "left"
                  ? "translateX(calc(-100% - 12px))"
                  : "translateX(12px)"
            }}
          >
            <div className="font-semibold tabular-nums text-[var(--foreground)]">
              {formatTooltipChance(hoverState.point.price)}
            </div>
            <div className="mt-1 whitespace-nowrap text-[var(--muted-foreground)]">
              {formatDateLabel(hoverState.point.timestamp)}
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
}

function TimeRangeControls({
  activeRangeLabel,
  onRangeChange
}: {
  activeRangeLabel: string;
  onRangeChange: (value: string) => void;
}) {
  return (
    <div className="flex items-center rounded-md bg-[var(--muted)] p-1 text-xs font-semibold">
      {TIME_RANGES.map((range) => (
        <button
          key={range.label}
          type="button"
          className={`min-w-10 rounded px-2 py-1.5 tabular-nums transition-colors ${
            activeRangeLabel === range.label
              ? "bg-[var(--card)] text-[var(--foreground)] shadow-sm"
              : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
          }`}
          onClick={() => onRangeChange(range.label)}
          aria-pressed={activeRangeLabel === range.label}
        >
          {range.label}
        </button>
      ))}
    </div>
  );
}
