import { z } from "zod";
import { polymarketOrderIntentSchema } from "./order-validation";

export const sdkSignedOrderRequestSchema = z.object({}).passthrough();

export const submitSignedOrderRequestSchema = z.object({
  intent: polymarketOrderIntentSchema,
  signedOrder: sdkSignedOrderRequestSchema.optional(),
  idempotencyKey: z.string().min(8).max(256).optional(),
  clientOrderId: z.string().min(1).max(128).optional()
});

export type SubmitSignedOrderRequest = z.infer<
  typeof submitSignedOrderRequestSchema
>;
