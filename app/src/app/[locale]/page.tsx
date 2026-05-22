import { redirect } from "next/navigation";
import type { Route } from "next";
import { type SupportedLocale } from "@/i18n/locales";
import { getLocalizedPolymarketFeedPath } from "@/features/prediction/routes";

type LocaleHomePageProps = {
  params: Promise<{
    locale: SupportedLocale;
  }>;
};

export default async function LocaleHomePage({ params }: LocaleHomePageProps) {
  const { locale } = await params;

  redirect(getLocalizedPolymarketFeedPath(locale) as Route);
}
