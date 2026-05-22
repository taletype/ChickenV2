import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { DocsPage } from "@/components/prediction-ui/docs/docs-page";
import { HowItWorksButton } from "@/components/prediction-ui/how-it-works-button";
import { LeaderboardPage } from "@/components/prediction-ui/leaderboard/leaderboard-page";
import { NotificationsButton } from "@/components/prediction-ui/notifications-button";
import { PublicProfilePage } from "@/components/prediction-ui/profile/public-profile-page";
import { SettingsPage } from "@/components/prediction-ui/settings/settings-page";
import { buildLeaderboardViewModel } from "@/features/prediction/leaderboard/adapter";
import { buildNotificationInboxViewModel } from "@/features/prediction/notifications/adapter";
import { buildPublicProfileViewModel } from "@/features/prediction/profile/adapter";

describe("reference parity V2 surfaces", () => {
  it("renders public profile unavailable state without fake user data", () => {
    render(
      <PublicProfilePage
        profile={buildPublicProfileViewModel({ slug: "alice" })}
        locale="en"
      />
    );

    expect(screen.getByText("@alice")).toBeInTheDocument();
    expect(screen.getByText("Public profile unavailable")).toBeInTheDocument();
    expect(screen.getByText("public_profile_backend_not_configured")).toBeInTheDocument();
    expect(screen.queryByText(/trader joe/i)).not.toBeInTheDocument();
    expect(screen.queryByText("$1,000.00")).not.toBeInTheDocument();
  });

  it("renders leaderboard unavailable state without fake rankings", () => {
    render(<LeaderboardPage leaderboard={buildLeaderboardViewModel()} locale="en" />);

    expect(screen.getByRole("heading", { name: "Leaderboard" })).toBeInTheDocument();
    expect(screen.getByText("Leaderboard unavailable")).toBeInTheDocument();
    expect(screen.getByText("leaderboard_backend_not_configured")).toBeInTheDocument();
    expect(screen.queryByText("#1")).not.toBeInTheDocument();
  });

  it("renders settings sections as adapter-unavailable shells", () => {
    render(<SettingsPage locale="en" section="notifications" />);

    expect(screen.getByRole("heading", { name: "Notifications" })).toBeInTheDocument();
    expect(screen.getByText("Notification settings unavailable")).toBeInTheDocument();
    expect(screen.getByText("notifications_settings_adapter_not_configured")).toBeInTheDocument();
  });

  it("renders notification dropdown without fake unread counts", () => {
    render(
      <NotificationsButton inbox={buildNotificationInboxViewModel()} locale="en" />
    );

    fireEvent.click(screen.getByRole("button", { name: "Open notifications" }));

    expect(screen.getByText("Notifications unavailable")).toBeInTheDocument();
    expect(screen.getByText("notifications_backend_not_configured")).toBeInTheDocument();
    expect(screen.queryByText("Order filled")).not.toBeInTheDocument();
  });

  it("renders V2 docs and help modal with fail-closed copy", () => {
    render(
      <>
        <DocsPage locale="en" slug={["safety"]} />
        <HowItWorksButton locale="en" />
      </>
    );

    expect(screen.getByRole("heading", { name: "Safety" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "How it works" }));
    expect(screen.getByText("Stay fail-closed")).toBeInTheDocument();
  });
});
