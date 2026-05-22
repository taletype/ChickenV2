import "server-only";
import { assertLiveSubmitGuards } from "../live-submit-guards";
import type { SubmitSignedOrderClientResult } from "../submit-signed-order-client";

export async function submitViaSdkFirstAdapter(
  _signedOrder: Record<string, unknown> | undefined
): Promise<SubmitSignedOrderClientResult> {
  const guards = assertLiveSubmitGuards();

  if (!guards.ok) {
    return {
      status: "blocked",
      code: guards.code,
      message: guards.message
    };
  }

  return {
    status: "blocked",
    code: "signed_submit_adapter_not_configured",
    message:
      "SDK-first live submission requires configured server credentials and a verified signed order."
  };
}
