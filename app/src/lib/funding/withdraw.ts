export type WithdrawResult =
  | {
      status: "submitted";
      txHash: string;
    }
  | {
      status: "unsupported_withdrawal_path";
      reason: "no_signed_transaction_adapter";
    };

export async function requestWithdraw(): Promise<WithdrawResult> {
  return {
    status: "unsupported_withdrawal_path",
    reason: "no_signed_transaction_adapter"
  };
}
