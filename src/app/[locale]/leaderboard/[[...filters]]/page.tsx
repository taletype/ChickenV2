import { LeaderboardPage } from "@/components/prediction-ui/leaderboard/leaderboard-page";
import { buildLeaderboardViewModel } from "@/features/prediction/leaderboard/adapter";

export default async function LeaderboardRoute({
  params
}: {
  params: Promise<{ locale: string; filters?: string[] }>;
}) {
  const { locale } = await params;
  const leaderboard = buildLeaderboardViewModel();

  return <LeaderboardPage leaderboard={leaderboard} locale={locale} />;
}
