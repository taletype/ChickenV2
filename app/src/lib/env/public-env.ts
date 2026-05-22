import { z } from "zod";

const publicEnvSchema = z.object({
  NEXT_PUBLIC_APP_NAME: z.string().default("Chicken Dinner"),
  NEXT_PUBLIC_REOWN_APPKIT_PROJECT_ID: z.string().optional()
});

export type PublicEnv = z.infer<typeof publicEnvSchema>;

export function getPublicEnv(): PublicEnv {
  return publicEnvSchema.parse({
    NEXT_PUBLIC_APP_NAME: process.env.NEXT_PUBLIC_APP_NAME,
    NEXT_PUBLIC_REOWN_APPKIT_PROJECT_ID:
      process.env.NEXT_PUBLIC_REOWN_APPKIT_PROJECT_ID
  });
}
