import { NextResponse } from "next/server";
import { z } from "zod";
import { syncDepositWalletClobBalanceAllowance } from "@/lib/polymarket/balance-allowance";
import { derivePolymarketDepositWalletAddress } from "@/lib/polymarket/deposit-wallet";
import { NO_STORE_HEADERS } from "@/lib/polymarket/cache-headers";

const SyncRequestSchema = z.object({
  address: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
  requiredAmount: z.number().nonnegative().optional()
});

export async function POST(request: Request) {
  const parsed = SyncRequestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, status: "blocked", code: "invalid_sync_request" },
      { status: 400, headers: NO_STORE_HEADERS }
    );
  }

  const depositWalletAddress = derivePolymarketDepositWalletAddress(parsed.data.address);
  const result = await syncDepositWalletClobBalanceAllowance({
    ownerAddress: parsed.data.address,
    depositWalletAddress,
    requiredAmount: parsed.data.requiredAmount
  });

  return NextResponse.json(result, {
    status: result.ok ? 200 : 403,
    headers: NO_STORE_HEADERS
  });
}
