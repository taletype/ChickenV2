export const DEFAULT_LOCALE = "zh" as const;
export const SUPPORTED_LOCALES = ["zh", "en"] as const;

export type SupportedLocale = (typeof SUPPORTED_LOCALES)[number];

export function isSupportedLocale(locale: string): locale is SupportedLocale {
  return SUPPORTED_LOCALES.includes(locale as SupportedLocale);
}
