import type { Route } from "next";
import { notFound, redirect } from "next/navigation";
import {
  buildLocalizedPolymarketFeedPath,
  buildLocalizedProfilePath,
  resolvePredictionRootSlugTarget
} from "@/features/prediction/routes";

export default async function RootSlugPage({
  params
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  const target = resolvePredictionRootSlugTarget(slug);

  if (target.kind === "profile") {
    if (!target.slug) {
      notFound();
    }
    return redirect(buildLocalizedProfilePath(locale, target.slug) as Route);
  }

  return redirect(
    buildLocalizedPolymarketFeedPath(locale, {
      category: target.category,
      search: target.search,
      sort: target.sort
    }) as Route
  );
}
