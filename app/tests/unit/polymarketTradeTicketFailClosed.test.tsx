import { describe, expect, it } from "vitest";
import { buildTradeTicketViewModel } from "@/features/prediction/trade-ticket/adapter";

describe("trade ticket adapter", () => {
  it("disables trading when token ids are unavailable", () => {
    const vm = buildTradeTicketViewModel({
      market: {
        id: "1",
        slug: "slug",
        href: "/zh/polymarket/slug",
        question: "Question?",
        category: null,
        image: null,
        volume24hr: null,
        liquidity: null,
        bestOutcome: null,
        outcomes: [{ label: "Yes", price: null, tokenId: null }],
        tradable: true,
        endDate: null
      }
    });

    expect(vm.status).toBe("disabled");
    expect(vm.disabledReason).toBe("missing_token_id");
  });
});
