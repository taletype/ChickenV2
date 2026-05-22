import { redirect } from "next/navigation";
import type { Route } from "next";
import { DEFAULT_LOCALE } from "@/i18n/locales";
import { getLocalizedPolymarketFeedPath } from "@/features/prediction/routes";

export default function HomePage() {
  redirect(getLocalizedPolymarketFeedPath(DEFAULT_LOCALE) as Route);
}
