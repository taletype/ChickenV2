# ChickenDinnerV2 Executive Summary

Audit date: 2026-05-22.

Scope: read-only audit of `ChickenV1`, `Kuest`, and V2 `app`.

Source edits: none.

Audit files only were created under `audits/`.

## V1 Verdict

V1 is the strongest source for Polymarket live-trading safety, signed-order gating, funding readiness, public market data handling, portfolio/account surfaces, comments, and production smoke scripts.

V1 should not be ported wholesale. It is too broad and includes admin, payout, Supabase, legacy routes, staging-era toggles, and operational code that would tangle V2.

Keep V1 as the safety and product reference. Extract narrow modules and tests only.

## Kuest Verdict

Kuest is useful as a product/UX reference for feed, charts, discussion, activity, portfolio, category navigation, and admin/editor patterns.

Kuest backend, auth, trading, DB, migration, credential, and runtime logic is forbidden for V2.

Kuest contains demo/test-mode residue and direct CLOB submit flow patterns that should not enter V2.

## V2 Recommendation

Continue V2 as the base.

V2 already has the correct adapter-first shape, Polymarket production data reads, fail-closed live trading gates, live top-up guardrails, deposit-wallet readiness, portfolio basics, and repo-native safety scripts.

V2 is not public-live complete. Its signed-order submit adapter is intentionally blocked with `signed_submit_adapter_not_configured`, and the trade ticket UI remains disabled even when readiness passes.

The next work should be selective porting from V1 first, then Kuest UX reconstruction.

## Direct Go/No-Go

V1 as production base: no.

Kuest as production base: no.

V2 as production base: yes, with blockers.

Public live trading in V2 today: no.

Public read-only market experience in V2 today: yes, limited.

## Next 5 Actions

1. Fix V2 env contract and docs for live top-up and CLOB credentials.
2. Port V1 SDK-first signed-order prepare/submit flow into V2 adapter boundaries.
3. Port V1 live-trading readiness checks, rate limits, canonical market validation, and audit attempt persistence.
4. Rebuild Kuest/V1 feed, chart, discussion, and portfolio UX on V2 data contracts only.
5. Run full V2 verification ladder after each phase: safety scripts, typecheck, unit tests, e2e smoke, production-data smoke.

## Critical Findings

Critical: V2 live order submit is not implemented; it remains blocked after guard checks.

Critical: Kuest direct CLOB submit/runtime logic must not be ported.

## High Findings

High: V2 `.env.example` is incomplete and mismatched with live top-up runtime env names.

High: V1 contains actual local env files; do not read, copy, or port values.

High: Kuest carries Better Auth, Drizzle/Postgres, Supabase/S3, and KUEST credential runtime dependencies that conflict with V2 boundaries.

High: V2 lacks discussion, activity, order history, open orders, leaderboards, admin, and mature portfolio UX.

## Verification Already Run

`cd /Users/ricky/Desktop/ChickenDinnerV2/app && pnpm run check:reference-boundaries` passed.

`cd /Users/ricky/Desktop/ChickenDinnerV2/app && pnpm run check:no-fake-market-data` passed.

`cd /Users/ricky/Desktop/ChickenDinnerV2/app && pnpm run check:live-trading-safety` passed.

`cd /Users/ricky/Desktop/ChickenDinnerV2/app && pnpm run check:live-topup-safety` passed.

`cd /Users/ricky/Desktop/ChickenDinnerV2/app && pnpm run check:production-env-safety` passed.

`cd /Users/ricky/Desktop/ChickenDinnerV2/app && pnpm run check:polymarket-production-data` passed with 3 Gamma markets returned.

`cd /Users/ricky/Desktop/ChickenDinnerV2/ChickenV1 && pnpm run check:live-trading-safety` passed.
