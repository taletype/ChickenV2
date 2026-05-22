import { DocsPage } from "@/components/prediction-ui/docs/docs-page";

export default async function DocsRoute({
  params
}: {
  params: Promise<{ locale: string; slug?: string[] }>;
}) {
  const { locale, slug } = await params;

  return <DocsPage locale={locale} slug={slug} />;
}
