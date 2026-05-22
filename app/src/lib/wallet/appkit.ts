"use client";

export type AppKitReadiness =
  | {
      ready: true;
      projectId: string;
    }
  | {
      ready: false;
      reason: "missing_project_id";
    };

export function getAppKitReadiness(projectId?: string): AppKitReadiness {
  if (!projectId) {
    return {
      ready: false,
      reason: "missing_project_id"
    };
  }

  return {
    ready: true,
    projectId
  };
}
