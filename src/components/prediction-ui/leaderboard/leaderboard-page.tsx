import { Trophy } from "lucide-react";
import type { PredictionLeaderboardViewModel } from "@/features/prediction/types";
import { SurfaceHeader, UnavailableState } from "../surface-card";

function isZh(locale: string) {
  return locale.toLowerCase().startsWith("zh");
}

export function LeaderboardPage({
  leaderboard,
  locale
}: {
  leaderboard: PredictionLeaderboardViewModel;
  locale: string;
}) {
  const labels = isZh(locale)
    ? {
        eyebrow: "排行榜",
        title: "排行榜",
        description: "排行榜只會在 V2 接入可驗證的真實排名 adapter 後顯示。",
        unavailableTitle: "排行榜暫不可用",
        unavailableDescription: "目前沒有可驗證的 V2 排名 adapter；不顯示假排名、成交量或盈虧。"
      }
    : {
        eyebrow: "Leaderboard",
        title: "Leaderboard",
        description: "Rankings appear only after V2 connects a verified real leaderboard adapter.",
        unavailableTitle: "Leaderboard unavailable",
        unavailableDescription: "No verified V2 leaderboard adapter is wired yet; fake ranks, volume, and PnL are not shown."
      };

  return (
    <main className="app-container-sm grid gap-6 py-8">
      <SurfaceHeader
        eyebrow={labels.eyebrow}
        title={labels.title}
        description={labels.description}
        icon={Trophy}
      />
      {leaderboard.status === "ready" ? (
        <div className="overflow-hidden rounded-lg border border-[var(--border)] bg-[var(--card)]">
          {leaderboard.rows.map((row) => (
            <div
              key={row.id}
              className="grid grid-cols-[4rem_minmax(0,1fr)_8rem] gap-3 border-b border-[var(--border)] px-4 py-3 text-sm last:border-b-0"
            >
              <span className="font-mono font-semibold">#{row.rank}</span>
              <span className="truncate font-semibold">{row.displayLabel}</span>
              <span className="text-right text-[var(--muted-foreground)]">
                {row.volume ?? "--"}
              </span>
            </div>
          ))}
        </div>
      ) : (
        <UnavailableState
          title={labels.unavailableTitle}
          description={labels.unavailableDescription}
          reason={leaderboard.reason}
        />
      )}
    </main>
  );
}
