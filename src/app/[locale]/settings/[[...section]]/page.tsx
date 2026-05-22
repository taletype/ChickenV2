import { notFound } from "next/navigation";
import {
  SettingsPage,
  SETTINGS_SECTIONS,
  type SettingsSection
} from "@/components/prediction-ui/settings/settings-page";

function resolveSettingsSection(section: string[] | undefined): SettingsSection {
  const [first, ...rest] = section ?? [];
  if (rest.length > 0) {
    notFound();
  }

  if (!first) {
    return "profile";
  }

  if (SETTINGS_SECTIONS.includes(first as SettingsSection)) {
    return first as SettingsSection;
  }

  notFound();
}

export default async function SettingsRoute({
  params
}: {
  params: Promise<{ locale: string; section?: string[] }>;
}) {
  const { locale, section } = await params;

  return <SettingsPage locale={locale} section={resolveSettingsSection(section)} />;
}
