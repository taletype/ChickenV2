import { z } from "zod";

export const submitSignedOrderRequestSchema = z.object({
  intent: z.unknown(),
  signedOrder: z.record(z.string(), z.unknown()).optional(),
  idempotencyKey: z.string().min(8).optional()
});

export type SubmitSignedOrderRequest = z.infer<typeof submitSignedOrderRequestSchema>;
