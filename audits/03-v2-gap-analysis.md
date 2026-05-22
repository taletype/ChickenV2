# V2 Gap Analysis

## Verdict

V2 is the correct base.

V2 has the right architecture direction: adapter-first, narrow routes, production Polymarket data, fail-closed trading, safety scripts, and explicit source boundaries.

V2 lacks enough product depth and signed-submit implementation to replace V1 or Kuest yet.

## What V2 Already Has

### App Shape

Routes:

- `src/app/[locale]/page.tsx`
- `src/app/[locale]/polymarket/page.tsx`
- `src/app/[locale]/polymarket/[slug]/page.tsx`
- `src/app/[locale]/portfolio/page.tsx`
- `src/app/api/polymarket/markets/route.ts`
- `src/app/api/polymarket/markets/[slug]/route.ts`
- `src/app/api/polymarket/markets/[slug]/price-history/route.ts`
- `src/app/api/polymarket/orders/submit/route.ts`
- `src/app/api/polymarket/account/portfolio/route.ts`
- `src/app/api/polymarket/funding/readiness/route.ts`
- `src/app/api/polymarket/deposit-wallet/*`

### Adapter Layer

Existing V2 adapters:

- `src/features/prediction/market-feed/adapter.ts`
- `src/features/prediction/market-detail/adapter.ts`
- `src/features/prediction/chart/adapter.ts`
- `src/features/prediction/trade-ticket/adapter.ts`
- `src/features/prediction/funding/adapter.ts`
- `src/features/prediction/portfolio/adapter.ts`
- `src/features/prediction/types.ts`

Strength:

V2 already separates UI view models from Polymarket APIs.

### Market Data

Existing production-data modules:

- `src/lib/polymarket/markets.ts`
- `src/lib/polymarket/normalize.ts`
- `src/lib/polymarket/endpoints.ts`
- `src/lib/polymarket/data-freshness.ts`
- `src/lib/polymarket/market-cache.ts`
- `src/lib/polymarket/cache-headers.ts`

Strength:

Market feed and details come from Polymarket APIs and normalize unavailable responses into unavailable/empty states, not fake data.

### Trading Safety

Existing guard modules:

- `src/lib/polymarket/live-submit-guards.ts`
- `src/lib/polymarket/liveTradingReadiness.ts`
- `src/lib/polymarket/order-validation.ts`
- `src/app/api/polymarket/orders/submit/route.ts`

Strength:

Live trading defaults to blocked unless explicit env gates pass.

### Funding / Deposit Wallet

Existing modules:

- `src/lib/polymarket/live-topup-env.ts`
- `src/lib/polymarket/live-topup-status.ts`
- `src/lib/polymarket/deposit-wallet.ts`
- `src/lib/polymarket/deposit-wallet-approval.ts`
- `src/lib/polymarket/balance-allowance.ts`
- `src/lib/polymarket/relayer.ts`
- `src/components/prediction-ui/funding/funding-panel.tsx`

Strength:

V2 already models top-up readiness, deposit wallet deployment, exact approval, CLOB balance/allowance sync, kill switch, and missing env states.

### Portfolio

Existing modules:

- `src/features/prediction/portfolio/adapter.ts`
- `src/components/prediction-ui/portfolio/portfolio-view.tsx`
- `src/lib/polymarket/analytics/positions.ts`
- `src/lib/polymarket/analytics/fills.ts`
- `src/lib/polymarket/analytics/pnl.ts`

Strength:

V2 can show real account data for a connected wallet.

### Safety Scripts

Already passed during audit:

- `pnpm run check:reference-boundaries`
- `pnpm run check:no-fake-market-data`
- `pnpm run check:live-trading-safety`
- `pnpm run check:live-topup-safety`
- `pnpm run check:production-env-safety`
- `pnpm run check:polymarket-collateral-setup-config`
- `pnpm run check:polymarket-production-data`

## What V2 Lacks From V1

### Critical Gaps

1. Signed-order prepare flow.
2. Signed-order submit implementation.
3. SDK-first typed-data order draft.
4. Placeholder signature rejection in actual submit path.
5. L2 credential setup and verification.
6. Canonical market/token validation before submit.
7. Geoblock integration.
8. Rate limits and failed-submit cooldown.
9. Audit/order-attempt persistence.
10. Builder fee evidence and idempotency.

Current blocker:

`src/lib/polymarket/sdk-first/index.ts` returns `signed_submit_adapter_not_configured`.

### Product Gaps

1. Mature event detail page.
2. Activity feed.
3. Comments/discussion.
4. Top holders.
5. Order book.
6. Open orders.
7. Orders page.
8. PnL page.
9. Leaderboard.
10. Public profile.
11. Referral/rewards pages.
12. Settings pages.
13. Admin pages.
14. i18n breadth.
15. SEO/structured data depth.

### Safety/Operations Gaps

1. Full production launch ladder.
2. Live submit idempotency persistence.
3. Per-user/wallet/IP submit counters.
4. Builder code audit surface.
5. More complete env example.
6. More complete e2e coverage.
7. Load harness.
8. Live domain smoke script.
9. Admin smoke script.
10. Secret redaction checks beyond public env.

## What V2 Lacks From Kuest

### UX Gaps

1. Category sidebar.
2. Secondary category navigation.
3. Rich event cards.
4. Advanced filter toolbar.
5. Search UX.
6. Mobile bottom navigation.
7. Full event chart controls.
8. Chart export/embed dialogs.
9. Live series chart.
10. Discussion/reply/like UX.
11. Holders-only discussion filter.
12. Portfolio hero.
13. Open-order tables.
14. Profile hero/activity/positions.
15. Admin event calendar/editor.
16. OG image generation.
17. Share cards.

### Product Workflow Gaps

1. Bookmarking.
2. Notifications.
3. Profile settings.
4. Theme settings.
5. Market context management.
6. Event creation.
7. Locales settings.
8. Sports templates.

### Do Not Fill With Kuest Runtime

Kuest UX should be rebuilt on V2 contracts.

Do not solve V2 gaps by importing Kuest backend/auth/trading/DB modules.

## Must Port

| Priority | Item | Source | Target Shape |
|---|---|---|---|
| P0 | SDK-first signed-order prepare/submit | V1 | V2 `TradingAdapter` implementation |
| P0 | Live submit readiness contract | V1 | V2 `live-submit-guards` plus tests |
| P0 | Canonical market/token validation | V1 | V2 server submit path |
| P0 | L2 credential/funder/signature validation | V1 | V2 server-only credential module |
| P0 | Rate limits and failed-submit cooldown | V1 | V2 API guard layer |
| P0 | Exact env contract for top-up/live submit | V1/V2 | V2 `.env.example` and checks |
| P1 | Funding/deposit wallet UX edge cases | V1/Kuest | V2 funding panel |
| P1 | Portfolio positions/fills/open orders | V1/Kuest | V2 account/portfolio view models |
| P1 | Event detail UX | V1/Kuest | V2 market detail layout |
| P1 | Chart controls/live series/trade flow | Kuest/V1 | V2 chart component |
| P1 | Discussion via safe proxy | V1/Kuest | V2 community adapter |
| P2 | Feed/category navigation | Kuest/V1 | V2 market feed |
| P2 | Mobile navigation | Kuest | V2 shell |
| P2 | SEO/OG/share cards | Kuest/V1 | V2 public routes |
| P3 | Admin/editor surfaces | Kuest/V1 | V2 admin after auth choice |

## Nice To Port

1. Sports-specific layouts.
2. Leaderboards.
3. Public profile pages.
4. Referral/rewards UX.
5. Theme editor.
6. Event calendar.
7. Docs/LLM text routes.
8. Embeds.
9. PWA install UX.
10. Localization breadth.

## Do Not Port

| Item | Source | Reason |
|---|---|---|
| Direct Kuest CLOB submit action | Kuest | Conflicts with V2 fail-closed adapter boundary. |
| KUEST auth credentials | Kuest | External dependency and wrong trust model. |
| Better Auth/Drizzle/Postgres stack | Kuest | Too large, not V2's current boundary. |
| Kuest migration script | Kuest | DB ownership mismatch. |
| Kuest TestMode/Amoy faucet/demo copy | Kuest | Public trust risk. |
| V1 payout executor | V1 | Private-key/hot-wallet risk, out of V2 scope. |
| V1 Supabase service-role admin internals | V1 | Out of V2 narrow app scope. |
| V1 local env values | V1 | Secret leakage risk. |
| V1 legacy event `store-order` path | V1 | Disabled/dead path. |
| Staging-era allowlist defaults | V1 | May conflict with current public-live posture. |

## Critical / High Gaps

Critical:

- V2 live order submit is blocked by design and not implemented.
- Kuest direct CLOB submit must not be copied.

High:

- V2 env example does not list the live top-up env names actually required by `live-topup-env.ts`.
- V2 has no persisted order attempts, idempotency, rate-limit counters, or full audit trail yet.
- V2 trade ticket UI cannot submit user size/order intent yet.
- V2 lacks real discussion/activity/open-order/account workflow depth.
- V1 local env files exist and must stay isolated.

## Recommended V2 Direction

Keep V2.

First make V2's live submit adapter real and verifiable.

Then rebuild product depth from Kuest/V1 UX patterns.

Keep every port behind V2's existing safety scripts and reference-boundary checks.
