import { notFound } from "next/navigation";
import { PublicProfilePage } from "@/components/prediction-ui/profile/public-profile-page";
import { buildPublicProfileViewModel } from "@/features/prediction/profile/adapter";

export default async function PublicProfileRoute({
  params
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  const profile = buildPublicProfileViewModel({ slug });

  if (!profile.slug) {
    notFound();
  }

  return <PublicProfilePage profile={profile} locale={locale} />;
}
