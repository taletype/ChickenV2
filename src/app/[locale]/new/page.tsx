import type { Route } from "next";
import { redirect } from "next/navigation";
import { buildLocalizedPolymarketFeedPath } from "@/features/prediction/routes";

export default async function NewMarketsPage({
  params
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  return redirect(buildLocalizedPolymarketFeedPath(locale, { sort: "recent" }) as Route);
}
