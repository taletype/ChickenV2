import { getRequestConfig } from "next-intl/server";
import { DEFAULT_LOCALE, isSupportedLocale, type SupportedLocale } from "./locales";
import { manualMessages, mergeMessages } from "./manual-messages";

async function loadMessages(locale: SupportedLocale) {
  const messages = (await import(`./messages/${locale}.json`)).default as Record<
    string,
    unknown
  >;

  return mergeMessages(messages, manualMessages[locale]);
}

export default getRequestConfig(async ({ requestLocale }) => {
  const requestedLocale = await requestLocale;
  const locale: SupportedLocale =
    requestedLocale && isSupportedLocale(requestedLocale)
      ? requestedLocale
      : DEFAULT_LOCALE;

  return {
    locale,
    messages: await loadMessages(locale)
  };
});
