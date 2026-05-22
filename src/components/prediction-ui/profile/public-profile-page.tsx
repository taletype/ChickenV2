import { UserRound } from "lucide-react";
import type { PredictionPublicProfileViewModel } from "@/features/prediction/types";
import { ActivityPanel } from "../activity/activity-panel";
import { SurfaceCard, SurfaceHeader, UnavailableState } from "../surface-card";

function isZh(locale: string) {
  return locale.toLowerCase().startsWith("zh");
}

export function PublicProfilePage({
  profile,
  locale
}: {
  profile: PredictionPublicProfileViewModel;
  locale: string;
}) {
  const labels = isZh(locale)
    ? {
        eyebrow: "公開個人檔案",
        description: "此頁會保留公開檔案版面，但只會顯示 V2 adapter 返回的真實資料。",
        unavailableTitle: "公開檔案暫不可用",
        unavailableDescription: "V2 尚未接入伺服器擁有的公開檔案 adapter，因此不顯示用戶、持倉或活動資料。",
        positions: "公開持倉",
        positionsDescription: "沒有 adapter 資料時不顯示持倉、價值、盈虧或排名。",
        activity: "公開活動"
      }
    : {
        eyebrow: "Public profile",
        description: "This page keeps the public profile surface, but only renders real data returned by V2 adapters.",
        unavailableTitle: "Public profile unavailable",
        unavailableDescription: "V2 has not connected a server-owned public profile adapter, so no user, position, or activity data is shown.",
        positions: "Public positions",
        positionsDescription: "Positions, value, PnL, and rank stay hidden until a verified adapter returns them.",
        activity: "Public activity"
      };

  return (
    <main className="app-container-sm grid gap-6 py-8">
      <SurfaceHeader
        eyebrow={labels.eyebrow}
        title={profile.displayLabel}
        description={labels.description}
        icon={UserRound}
      />

      {profile.status !== "ready" ? (
        <UnavailableState
          title={labels.unavailableTitle}
          description={labels.unavailableDescription}
          reason={profile.reason}
        />
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <SurfaceCard title={labels.positions} description={labels.positionsDescription}>
          <div className="grid min-h-[180px] place-items-center rounded-md border border-dashed border-[var(--border)] px-4 py-8 text-center text-sm text-[var(--muted-foreground)]">
            {labels.positionsDescription}
          </div>
        </SurfaceCard>
        <section className="grid gap-3">
          <h2 className="text-base font-semibold text-[var(--foreground)]">
            {labels.activity}
          </h2>
          <ActivityPanel activity={profile.activity} locale={locale} />
        </section>
      </div>
    </main>
  );
}
