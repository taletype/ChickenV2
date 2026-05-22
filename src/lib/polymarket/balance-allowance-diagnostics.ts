export type BalanceAllowanceDiagnostics =
  | {
      status: "available";
      balance: string;
      allowance: string;
    }
  | {
      status: "unavailable";
      reason: "missing_credentials" | "missing_wallet" | "upstream_unavailable";
    };

export function unavailableBalanceAllowance(
  reason: BalanceAllowanceDiagnostics extends { reason: infer R } ? R : never
): BalanceAllowanceDiagnostics {
  return {
    status: "unavailable",
    reason
  };
}
