import {
  buildAccountActivityViewModel
} from "@/features/prediction/activity/adapter";
import type { PredictionPublicProfileViewModel } from "@/features/prediction/types";

export const PUBLIC_PROFILE_BACKEND_UNAVAILABLE_REASON =
  "public_profile_backend_not_configured";

export function normalizePublicProfileSlug(slug: string) {
  return decodeURIComponent(slug).trim().replace(/^@+/, "");
}

export function buildPublicProfileViewModel(options: {
  slug: string;
}): PredictionPublicProfileViewModel {
  const slug = normalizePublicProfileSlug(options.slug);
  const displayLabel = slug ? `@${slug}` : "Profile";

  return {
    status: "unavailable",
    slug,
    displayLabel,
    positions: [],
    activity: buildAccountActivityViewModel(),
    reason: PUBLIC_PROFILE_BACKEND_UNAVAILABLE_REASON,
    error: null
  };
}
