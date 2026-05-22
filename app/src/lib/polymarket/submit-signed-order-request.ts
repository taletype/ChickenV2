import { z } from "zod";
import {
  polymarketOrderIntentSchema,
  signedPolymarketOrderSchema
} from "./order-validation";

export const submitSignedOrderRequestSchema = z.object({
  intent: polymarketOrderIntentSchema,
  signedOrder: signedPolymarketOrderSchema.optional(),
  idempotencyKey: z.string().min(8).max(256).optional(),
  clientOrderId: z.string().min(1).max(128).optional()
});

export type SubmitSignedOrderRequest = z.infer<
  typeof submitSignedOrderRequestSchema
>;
