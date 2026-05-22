# ChickenV1 Audit

## Verdict

ChickenV1 is the best reference for real Polymarket safety and production hardening.

It is not a clean V2 base. It mixes mature product surfaces with old platform routes, admin, Supabase, payout automation, staging-era gates, and operational scripts.

Port from V1 by capability, not by directory.

## Inspected Areas

- `ChickenV1/package.json`
- `ChickenV1/.env.example`
- `ChickenV1/src/app/[locale]/(platform)`
- `ChickenV1/src/app/api`
- `ChickenV1/src/components`
- `ChickenV1/src/hooks`
- `ChickenV1/src/lib`
- `ChickenV1/scripts`
- `ChickenV1/tests`

## Severity Table

| Severity | Finding | Evidence | V2 Action |
|---|---|---|---|
| Critical | V1 should not be lifted wholesale because it includes unrelated admin, payout, Supabase, docs, translations, and legacy product routes. | Large route tree under `src/app/[locale]/(platform)` and `src/app/api`; broad `src/lib` surface. | Extract only bounded modules. |
| Critical | V1 live submit safety is mature and should be used as the main reference. | `src/lib/polymarket/liveTradingReadiness.ts`, `src/app/[locale]/(platform)/polymarket/_actions/prepare-signed-order.ts`, `submit-signed-order.ts`. | Port concepts into V2 adapters. |
| High | Real payout executor code exists and must not enter V2 unless a separate payout product is explicitly approved. | `src/workers/payout-executor.ts`, `scripts/payout-executor.ts`, `.env.example` payout keys. | Do not port. |
| High | Actual env files exist in V1. Values were not inspected. | `.env`, `.env.local`, `.vercel/.env.production.local` present. | Do not read/copy; verify ignored. |
| High | Old event order path exists but is disabled. | `src/app/[locale]/(platform)/event/[slug]/_actions/store-order.ts` returns `實盤提交已停用`. | Do not port legacy event order path. |
| High | V1 has many staging/allowlist era toggles. Some are useful gates, but defaults may not match V2's current public-live plan. | `.env.example` includes `POLYMARKET_ALLOWLIST_REQUIRED`, staging real submit, smoke flags. | Port gate types, not stale defaults. |
| Medium | Safety scripts are strong but tightly coupled to V1 file names and Supabase migrations. | `scripts/check-live-trading-safety.mjs`. | Recreate V2-native checks. |
| Medium | Product UX is mature but route/component dependencies are deep. | Event, portfolio, comments, profile, sports, admin route trees. | Rebuild UX on V2 view models. |
| Medium | Load harness keeps financial flows mocked. | `scripts/load/k6-100k-dau.js`, `scripts/load/load-safety.mjs`. | Keep dry-run load philosophy. |
| Low | Translation/i18n surface is rich but too broad for first V2 phases. | `src/i18n/messages/*`, `next-intl`. | Port only after V2 route map stabilizes. |

## Good / Keep Modules

### Live Trading Safety

Keep the V1 safety model:

- `src/lib/polymarket/liveTradingReadiness.ts`
- `src/lib/polymarket/live-submit-guards.ts`
- `src/lib/polymarket/live-clob-adapter.ts`
- `src/lib/polymarket/order-validation.ts`
- `src/lib/polymarket/server-order-market.ts`
- `src/lib/polymarket/live-order-rate-limits.ts`
- `src/lib/polymarket/live-trading-audit.ts`

Reasons:

- Checks public live flags, live submit flags, kill switches, signer health, geoblock, L2 credentials, builder code, order validity, freshness, notional caps, and identity consistency.
- Separates prepare and submit phases.
- Requires user risk disclosure before preparing live order.
- Revalidates canonical market data server-side before submit.
- Records metrics and failed-submit cooldowns.

### SDK-First Order Flow

Keep the V1 concept:

- `src/app/[locale]/(platform)/polymarket/_actions/prepare-signed-order.ts`
- `src/app/[locale]/(platform)/polymarket/_actions/submit-signed-order.ts`
- `src/lib/polymarket/sdk-first`
- `src/lib/polymarket/client-order-signing.ts`

Port as V2 adapter implementations, not as direct server actions.

Required properties:

- Canonical market lookup before order creation.
- Token belongs to market.
- Signed order identity matches wallet/deposit wallet context.
- User credentials are present and decryptable.
- Builder code is present.
- Geoblock and signer health are checked.
- User signature is required.
- Failed submits trigger cooldown.

### Market Data and Truthfulness

Keep:

- `src/lib/polymarket/markets.ts`
- `src/lib/polymarket/normalize.ts`
- `src/lib/polymarket/endpoints.ts`
- `src/lib/polymarket/data-freshness.ts`
- `src/lib/polymarket/cache-headers.ts`

Reasons:

- V1 has robust production-data normalization and freshness handling.
- It avoids treating unavailable upstream data as real market data.
- It has production data smoke scripts.

### Funding / Deposit Wallet

Keep concepts from:

- `src/app/[locale]/(platform)/_components/TradingDialogs.tsx`
- `src/app/[locale]/(platform)/_components/WalletModal.tsx`
- `src/components/polymarket/trade-ticket/*`
- `src/lib/polymarket/deposit-wallet*`
- `src/lib/polymarket/balance-allowance*`
- `src/lib/polymarket/relayer*`

V2 already has a cleaner live top-up foundation. Use V1 for missing edge cases and UX details.

### Product UX

Keep as UX reference:

- Home feed: category sidebar, filters, event cards, skeletons.
- Event detail: chart, activity, market rows, order book, top holders, rules, related markets, FAQ.
- Comments: optimistic comments, replies, likes, holders-only filter, live channel.
- Portfolio: hero, positions, open orders, pending deposits, PnL, wallet actions.
- Profile/public activity: public positions, activity filters, share cards.

### Safety Scripts

Keep as operational inspiration:

- `scripts/check-live-trading-safety.mjs`
- `scripts/check-production-env-safety.mjs`
- `scripts/check-polymarket-production-data.mjs`
- `scripts/check-polymarket-collateral-setup-config.mjs`
- `scripts/load/load-safety.mjs`

V2 has simpler versions already. Preserve V2's smaller boundary checks and add V1 cases incrementally.

## Risky / Tangled Modules

### Payout and Rewards

Risk:

- `src/workers/payout-executor.ts`
- `scripts/payout-executor.ts`
- `src/lib/payouts/*`
- admin payout pages and APIs

Why risky:

- Handles private keys, hot-wallet transfer, auto-approval, batching, fraud flags, and kill switches.
- Not required for V2 prediction market base.

Verdict: do not port now.

### Supabase/Admin Platform

Risk:

- `src/lib/supabase/*`
- admin protected route tree
- service-role paths
- sync APIs
- translations/jobs routes

Why risky:

- Pulls V2 away from adapter-first Polymarket scope.
- Adds admin/auth/data ownership questions before V2 product surface is ready.

Verdict: reference only.

### Legacy Event Trading Path

Risk:

- `src/app/[locale]/(platform)/event/[slug]/_actions/store-order.ts`
- old event order panel files
- old trading adapter placeholder

Current state:

- Store order action validates shape but returns disabled.
- This is safer than live submit, but it is still a dead/legacy path.

Verdict: do not port.

### Broad Sports/Event Creation System

Risk:

- sports pages, sports metadata, event creation, admin generation, translations.

Why risky:

- Large product expansion before V2 proves core Polymarket flow.

Verdict: nice-to-port later, after trading and account surfaces.

## Fake Data Findings

V1 does not appear to rely on fake market data for public production paths.

Mock/fake references are concentrated in tests, translation mocks, and load harness financial-flow mocks.

The load harness explicitly keeps order submit and payout flows mocked/dry-run.

Good pattern to keep: financial load tests must never place real trades or payouts.

## Security Findings

Actual local env files exist:

- `ChickenV1/.env`
- `ChickenV1/.env.local`
- `ChickenV1/.vercel/.env.production.local`

Values were not opened.

Risk: accidental copy, leakage, or V2 env contamination.

Action: never port values; verify `.gitignore` and secret scanning before any migration.

V1 `.env.example` includes sensitive env names for Supabase service role, payout executor private key, builder credentials, relayer credentials, and L2 credential encryption.

Action: port names only when required by V2, never values.

## Live-Trading Findings

Passed:

`cd /Users/ricky/Desktop/ChickenDinnerV2/ChickenV1 && pnpm run check:live-trading-safety`

Important V1 live-trading properties:

- Default live flags are disabled.
- Kill switches default active.
- Builder code required.
- L2 credentials required.
- Polygon chain required.
- Geoblock and signer health required.
- Notional caps exist.
- No platform private key is allowed in the live user trading path.
- No raw L2 credentials should render in frontend.

V1 public-live path is mature but not small. V2 should port the safety contract, not the whole implementation.

## Env Findings

V1 `.env.example` is comprehensive and production-like.

Useful env concepts:

- `POLYMARKET_PUBLIC_LIVE_ENABLED`
- `POLYMARKET_LIVE_SUBMIT_ENABLED`
- `POLYMARKET_KILL_SWITCH`
- `POLYMARKET_REQUIRE_GEO_ALLOWED`
- `POLYMARKET_REQUIRE_SIGNER_HEALTH`
- `POLYMARKET_REQUIRE_L2_CREDENTIALS`
- `POLYMARKET_REQUIRE_BUILDER_CODE`
- `POLY_BUILDER_CODE`
- `POLYMARKET_MAX_ORDER_NOTIONAL_USD`
- `POLYMARKET_MAX_DAILY_NOTIONAL_USD`

Do not blindly port:

- staging real-submit flags
- allowlist defaults if V2 is public-live
- payout executor env
- Supabase service-role env
- translation provider env until needed

## Test Findings

V1 has broad unit, e2e, production smoke, and load harness scripts.

Only live-trading safety was run during this audit.

Recommended V1-derived V2 test additions:

- signed submit rejects placeholder signatures
- submit validates canonical market/token
- submit blocks missing builder code
- submit blocks wrong chain
- submit blocks stale market metadata
- submit rate limits per user/wallet/IP
- fake market data scanner stays green
- reference-boundary scanner forbids Kuest and V1 imports

## Porting Verdict

Must port from V1 first:

1. SDK-first signed-order prepare/submit.
2. Live-trading readiness contract.
3. Canonical market validation.
4. L2 credential/readiness checks.
5. Rate limiting and failed-submit cooldown.
6. Builder code and audit-attempt persistence.
7. Production data freshness checks.
8. Portfolio/open-order account APIs.
9. Comment/discussion safe proxy pattern.
10. Safety scripts.

Do not port from V1:

1. Payout executor.
2. Supabase admin internals.
3. Legacy event order action.
4. Raw env files.
5. Staging-era defaults without review.
6. Full admin/event-creation stack in early phases.
7. Load-test financial submit behavior except dry-run policy.
8. Disabled/mock trading adapters.
9. Old payout/reward automation.
10. Service-role usage into client/shared code.
