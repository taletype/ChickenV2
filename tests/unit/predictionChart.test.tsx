import { describe, expect, it } from "vitest";
import { buildChartViewModelFromPoints } from "@/features/prediction/chart/adapter";

describe("prediction chart adapter", () => {
  it("uses empty state for missing real chart data", () => {
    expect(buildChartViewModelFromPoints([])).toMatchObject({
      status: "empty",
      points: [],
      latestPrice: null
    });
  });
});
