import { readFile } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();

const requiredFiles = [
  "src/lib/env/server-env.ts",
  "src/lib/polymarket/live-topup-env.ts",
  "src/lib/polymarket/deposit-wallet-approval.ts",
  "src/lib/polymarket/balance-allowance.ts",
  "src/lib/polymarket/relayer.ts",
  "src/app/api/polymarket/deposit-wallet/approval-submit/route.ts",
  "src/components/prediction-ui/funding/funding-panel.tsx"
];

const corpus = (
  await Promise.all(
    requiredFiles.map((file) => readFile(path.join(root, file), "utf8"))
  )
).join("\n");

const requiredTokens = [
  "POLYMARKET_LIVE_TOP_UP_ENABLED",
  "POLYMARKET_LIVE_TOP_UP_KILL_SWITCH",
  ".default(\"false\")",
  "assertLiveTopUpMutationAllowed",
  "buildSignedDepositWalletApprovalPayload",
  "submitSignedDepositWalletBatch",
  "maxUint256",
  "amount_mismatch",
  "approval_batch_must_contain_one_call",
  "Submit disabled: live top-up gates are closed",
  "signTypedData",
  "approval_required",
  "approval-submit"
];

const missing = requiredTokens.filter((token) => !corpus.includes(token));

if (missing.length > 0) {
  console.error(`live top-up safety tokens missing: ${missing.join(", ")}`);
  process.exit(1);
}

if (/maxUint256\s*\]/.test(corpus) || /args:\s*\[[^\]]*maxUint256/.test(corpus)) {
  console.error("live top-up safety check failed: unlimited approval appears to be submitted");
  process.exit(1);
}

console.log("live top-up safety check passed");
