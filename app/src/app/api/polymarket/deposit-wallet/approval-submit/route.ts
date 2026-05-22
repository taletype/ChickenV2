import { NextResponse } from "next/server";
import { z } from "zod";
import {
  buildSignedDepositWalletApprovalPayload
} from "@/lib/polymarket/deposit-wallet-approval";
import { submitSignedDepositWalletBatch } from "@/lib/polymarket/relayer";
import { NO_STORE_HEADERS } from "@/lib/polymarket/cache-headers";

const DepositWalletCallSchema = z.object({
  target: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
  value: z.string().regex(/^\d+$/),
  data: z.string().regex(/^0x[a-fA-F0-9]*$/)
});

const ApprovalSubmitRequestSchema = z.object({
  ownerAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
  depositWalletAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
  nonce: z.string().regex(/^\d+$/),
  deadline: z.string().regex(/^\d+$/),
  signature: z.string().regex(/^0x[a-fA-F0-9]{130}$/),
  calls: z.array(DepositWalletCallSchema).length(1),
  amountBaseUnits: z.string().regex(/^\d+$/),
  spenderAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/).optional()
});

export async function POST(request: Request) {
  const parsed = ApprovalSubmitRequestSchema.safeParse(
    await request.json().catch(() => null)
  );
  if (!parsed.success) {
    return NextResponse.json(
      { status: "blocked", code: "invalid_approval_submit_request" },
      { status: 400, headers: NO_STORE_HEADERS }
    );
  }

  try {
    const payload = buildSignedDepositWalletApprovalPayload(parsed.data);
    const result = await submitSignedDepositWalletBatch(payload);

    return NextResponse.json(result, {
      status: result.status === "submitted" ? 200 : 403,
      headers: NO_STORE_HEADERS
    });
  } catch (error) {
    return NextResponse.json(
      {
        status: "blocked",
        code: error instanceof Error ? error.message : "approval_submit_blocked"
      },
      { status: 403, headers: NO_STORE_HEADERS }
    );
  }
}
