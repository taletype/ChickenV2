import type { PolymarketOrderIntent } from "./order-validation";
import { validatePolymarketOrderIntent } from "./order-validation";

export type PreparedPolymarketOrder =
  | {
      status: "ready";
      intent: PolymarketOrderIntent;
      requiresSignature: true;
    }
  | {
      status: "blocked";
      code: string;
      message: string;
    };

export function preparePolymarketOrderIntent(input: unknown): PreparedPolymarketOrder {
  const validation = validatePolymarketOrderIntent(input);

  if (!validation.ok) {
    return {
      status: "blocked",
      code: validation.code,
      message: validation.message
    };
  }

  return {
    status: "ready",
    intent: validation.intent,
    requiresSignature: true
  };
}
