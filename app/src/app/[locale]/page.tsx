import { redirect } from "next/navigation";
import { type SupportedLocale } from "@/i18n/locales";

type LocaleHomePageProps = {
  params: Promise<{
    locale: SupportedLocale;
  }>;
};

export default async function LocaleHomePage({ params }: LocaleHomePageProps) {
  const { locale } = await params;

  redirect(`/${locale}/polymarket`);
}
