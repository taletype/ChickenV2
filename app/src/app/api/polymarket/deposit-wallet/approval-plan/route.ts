import { NextResponse } from "next/server";
import { z } from "zod";
import { buildDepositWalletApprovalPlan } from "@/lib/polymarket/deposit-wallet-approval";
import { NO_STORE_HEADERS } from "@/lib/polymarket/cache-headers";

const ApprovalPlanRequestSchema = z.object({
  address: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
  amountBaseUnits: z.string().regex(/^\d+$/),
  spenderAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/).optional(),
  deadlineSeconds: z.number().int().positive().optional()
});

export async function POST(request: Request) {
  const parsed = ApprovalPlanRequestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { status: "blocked", code: "invalid_approval_plan_request" },
      { status: 400, headers: NO_STORE_HEADERS }
    );
  }

  const plan = await buildDepositWalletApprovalPlan({
    ownerAddress: parsed.data.address,
    amountBaseUnits: parsed.data.amountBaseUnits,
    spenderAddress: parsed.data.spenderAddress,
    deadlineSeconds: parsed.data.deadlineSeconds
  });

  return NextResponse.json(plan, {
    status: plan.status === "ready" ? 200 : 403,
    headers: NO_STORE_HEADERS
  });
}
