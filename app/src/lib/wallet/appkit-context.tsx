"use client";

import type { OpenOptions, Views } from "@reown/appkit/react";
import { createContext, use } from "react";

export type AppKitDisabledReason =
  | "missing_project_id"
  | "initialization_failed"
  | null;

export type AppKitController = {
  open: (options?: OpenOptions<Views>) => Promise<void>;
  close: () => Promise<void>;
  ready: boolean;
  disabledReason: AppKitDisabledReason;
};

export const defaultAppKitController: AppKitController = {
  open: async () => {},
  close: async () => {},
  ready: false,
  disabledReason: null
};

export const AppKitControllerContext = createContext<AppKitController>(
  defaultAppKitController
);

export function useAppKitController() {
  return use(AppKitControllerContext);
}
