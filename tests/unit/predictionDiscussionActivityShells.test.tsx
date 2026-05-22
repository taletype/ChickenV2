import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ActivityPanel } from "@/components/prediction-ui/activity/activity-panel";
import { OpenOrdersPanel } from "@/components/prediction-ui/activity/open-orders-panel";
import { DiscussionPanel } from "@/components/prediction-ui/discussion/discussion-panel";
import {
  buildMarketActivityViewModel,
  buildMarketOpenOrdersViewModel
} from "@/features/prediction/activity/adapter";
import { buildDiscussionViewModel } from "@/features/prediction/discussion/adapter";

describe("prediction discussion and activity shells", () => {
  it("renders discussion unavailable state without fake comments, users, or counts", () => {
    render(
      <DiscussionPanel
        discussion={buildDiscussionViewModel({ marketSlug: "adapter-market" })}
        locale="en"
      />
    );

    expect(screen.getByText("Discussion unavailable")).toBeInTheDocument();
    expect(screen.getByText("Post unavailable")).toBeDisabled();
    expect(screen.queryByText(/anonymous/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/trader/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/0 likes/i)).not.toBeInTheDocument();
  });

  it("renders comment empty state only when the discussion adapter reports empty", () => {
    render(
      <DiscussionPanel
        discussion={{
          status: "empty",
          marketSlug: "adapter-market",
          comments: [],
          reason: null,
          error: null
        }}
        locale="en"
      />
    );

    expect(screen.getByText("No comments returned")).toBeInTheDocument();
    expect(screen.getByText("This state appears only when the V2 discussion adapter returns an empty comment list.")).toBeInTheDocument();
  });

  it("renders activity and open-orders unavailable states without fake account rows", () => {
    render(
      <>
        <ActivityPanel activity={buildMarketActivityViewModel()} locale="en" />
        <OpenOrdersPanel openOrders={buildMarketOpenOrdersViewModel()} locale="en" />
      </>
    );

    expect(screen.getByText("Market activity unavailable")).toBeInTheDocument();
    expect(screen.getByText("Open orders unavailable")).toBeInTheDocument();
    expect(screen.queryByText("Open order #1")).not.toBeInTheDocument();
    expect(screen.queryByText("Trader Joe")).not.toBeInTheDocument();
    expect(screen.queryByText("100 shares")).not.toBeInTheDocument();
  });

  it("renders activity and open-orders empty states only from adapter empty models", () => {
    render(
      <>
        <ActivityPanel
          activity={{
            status: "empty",
            scope: "market",
            records: [],
            reason: null,
            error: null
          }}
          locale="en"
        />
        <OpenOrdersPanel
          openOrders={{
            status: "empty",
            scope: "market",
            orders: [],
            reason: null,
            error: null
          }}
          locale="en"
        />
      </>
    );

    expect(screen.getByText("No activity returned")).toBeInTheDocument();
    expect(screen.getByText("No open orders returned")).toBeInTheDocument();
  });
});
