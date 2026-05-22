# Recommended Next Phases

## Phase Order

1. Phase 0: Preserve boundaries and source freeze.
2. Phase 1: Fix V2 env contract and safety docs.
3. Phase 2: Implement V2 signed-order prepare/submit adapter.
4. Phase 3: Add order-attempt audit, rate limits, idempotency, and cooldown.
5. Phase 4: Complete trade ticket UX and live-submit form state.
6. Phase 5: Expand funding/deposit wallet UX.
7. Phase 6: Expand portfolio/open orders/account history.
8. Phase 7: Rebuild event detail, chart, and feed UX.
9. Phase 8: Rebuild discussion/activity/top holders.
10. Phase 9: Add admin, SEO/OG, i18n, and production launch ladder.

## Phase 0: Preserve Boundaries And Source Freeze

Goal:

Keep V2 independent from `ChickenV1` and `Kuest`.

Actions:

- Keep `ChickenV1` and `Kuest` read-only references.
- Keep all source imports inside `app`.
- Keep all future audit notes outside source.
- Confirm no direct imports from reference directories.

Verification:

```bash
cd /Users/ricky/Desktop/ChickenDinnerV2/app
pnpm run check:reference-boundaries
pnpm run check:no-fake-market-data
git status --short
```

Exit criteria:

- No V1/Kuest imports.
- No fake market data.
- Source changes are only intentional V2 changes.

## Phase 1: Fix V2 Env Contract And Safety Docs

Goal:

Make `.env.example`, `server-env.ts`, live top-up env checks, and production safety checks agree.

Actions:

- Add missing live top-up env names to V2 `.env.example`.
- Align `POLYMARKET_CLOB_API_*` vs `CLOB_*` naming.
- Add `POLYMARKET_LIVE_TOP_UP_ENABLED`.
- Add `POLYMARKET_LIVE_TOP_UP_KILL_SWITCH`.
- Add `RELAYER_URL`.
- Add `BUILDER_API_KEY`, `BUILDER_SECRET`, `BUILDER_PASS_PHRASE`.
- Add `CLOB_API_KEY`, `CLOB_SECRET`, `CLOB_PASS_PHRASE`, `CLOB_API_URL`.
- Add `PUSD_ADDRESS`, `DEPOSIT_WALLET_FACTORY_ADDRESS`, and optional implementation address.
- Keep every live and mutation flag disabled by default.

Verification:

```bash
cd /Users/ricky/Desktop/ChickenDinnerV2/app
pnpm run check:production-env-safety
pnpm run check:live-topup-safety
pnpm run check:polymarket-collateral-setup-config
pnpm run typecheck
```

Exit criteria:

- Env docs match runtime parser names.
- Safety scripts pass with empty/default env.
- Typecheck passes.

## Phase 2: Implement V2 Signed-Order Prepare/Submit Adapter

Goal:

Replace `signed_submit_adapter_not_configured` with a guarded SDK-first submit path.

Actions:

- Port V1 SDK-first order draft behavior into V2 server-only adapter.
- Add prepare endpoint or server action as V2 requires.
- Validate canonical market, token, side, price, size, tick size, chain, wallet, and funder.
- Reject placeholder signatures.
- Require user signed order.
- Require builder code.
- Require explicit operator live confirmation.
- Keep submit blocked when live env is incomplete.

Verification:

```bash
cd /Users/ricky/Desktop/ChickenDinnerV2/app
pnpm run check:live-trading-safety
pnpm run check:production-env-safety
pnpm run test:unit -- orderValidation
pnpm run test:unit -- polymarketSdkFirstAdapter
pnpm run typecheck
```

Exit criteria:

- Missing env blocks.
- Placeholder signatures block.
- Wrong identity blocks.
- Valid dry fixture reaches adapter-ready state without live submit.

## Phase 3: Add Audit, Rate Limits, Idempotency, Cooldown

Goal:

Make live submit observable and repeat-safe.

Actions:

- Persist order attempts.
- Add idempotency key/hash.
- Add external order ID uniqueness.
- Add per-user/wallet/IP rate limits.
- Add failed-submit cooldown.
- Add safe audit event logging without secrets.
- Add tests for repeated submit, failed submit, and cooldown.

Verification:

```bash
cd /Users/ricky/Desktop/ChickenDinnerV2/app
pnpm run check:live-trading-safety
pnpm run check:production-env-safety
pnpm run test:unit
pnpm run typecheck
```

Exit criteria:

- Duplicate submit cannot create duplicate live attempts.
- Failed submit triggers cooldown.
- Logs contain no secrets.

## Phase 4: Complete Trade Ticket UX

Goal:

Allow the operator/user to explicitly select market, outcome, side, price, and size before submit.

Actions:

- Enable amount input only after wallet/funding/server gates pass.
- Add price validation and tick snapping.
- Add market/limit order controls if in scope.
- Add risk disclosure checkbox.
- Add order preview.
- Add signed-order prepare and submit state machine.
- Never auto-select final trade parameters beyond visible defaults.

Verification:

```bash
cd /Users/ricky/Desktop/ChickenDinnerV2/app
pnpm run test:unit -- polymarketTradeTicketFailClosed
pnpm run test:unit -- polymarketFundingFlow
pnpm run test:e2e
pnpm run typecheck
```

Exit criteria:

- Submit stays disabled until explicit selection and all gates pass.
- Wrong chain blocks.
- Missing wallet blocks.
- Missing funding blocks.
- Missing server live env blocks.

## Phase 5: Expand Funding / Deposit Wallet UX

Goal:

Make top-up and approval flows usable without weakening gates.

Actions:

- Complete copy for each readiness step.
- Improve deploy/sync/approval states.
- Add recoverable errors and refresh actions.
- Keep exact approval only.
- Keep kill switch first-class.

Verification:

```bash
cd /Users/ricky/Desktop/ChickenDinnerV2/app
pnpm run check:live-topup-safety
pnpm run check:polymarket-collateral-setup-config
pnpm run test:unit -- polymarketFundingFlow
pnpm run test:unit -- polymarketLiveTopUpEnv
pnpm run typecheck
```

Exit criteria:

- Unlimited approval cannot be submitted.
- Kill switch blocks all mutations.
- Missing env is visible and non-mutating.

## Phase 6: Expand Portfolio / Open Orders / Account History

Goal:

Bring V1/Kuest account depth into V2.

Actions:

- Add open orders.
- Add order cancel path only after submit path is safe.
- Add fills, positions, PnL, current value, pending deposits.
- Add account status panel.
- Add private no-store headers for account APIs.

Verification:

```bash
cd /Users/ricky/Desktop/ChickenDinnerV2/app
pnpm run test:unit -- accountPortfolioViewModel
pnpm run test:unit
pnpm run typecheck
pnpm run check:production-env-safety
```

Exit criteria:

- Disconnected wallet shows no fake balances.
- Account APIs are private/no-store.
- Empty upstream data is not presented as fake positions.

## Phase 7: Rebuild Event Detail, Chart, And Feed UX

Goal:

Port product richness without Kuest/V1 runtime coupling.

Actions:

- Add category sidebar and filter toolbar.
- Add richer market cards.
- Add advanced chart controls.
- Add live series/trade-flow chart affordances if supported by data.
- Add event tabs, rules, related markets, top holders, order book.
- Keep all data from V2 adapters.

Verification:

```bash
cd /Users/ricky/Desktop/ChickenDinnerV2/app
pnpm run check:no-fake-market-data
pnpm run check:polymarket-production-data
pnpm run test:unit -- marketFeedAdapter
pnpm run test:unit -- predictionChart
pnpm run test:e2e
pnpm run typecheck
```

Exit criteria:

- Feed uses production data only.
- Chart empty/unavailable states are honest.
- No Kuest/V1 imports.

## Phase 8: Rebuild Discussion / Activity / Top Holders

Goal:

Add social context without leaking auth or relying on Kuest client env patterns.

Actions:

- Add V2 discussion adapter.
- Use server proxy or explicit public-safe community env.
- Add comments list, replies, likes, holders-only filter.
- Add activity feed.
- Add top holders from Polymarket data API.
- Add moderation/delete only after auth model is defined.

Verification:

```bash
cd /Users/ricky/Desktop/ChickenDinnerV2/app
pnpm run check:reference-boundaries
pnpm run check:production-env-safety
pnpm run test:unit
pnpm run test:e2e
pnpm run typecheck
```

Exit criteria:

- Client does not read non-public secrets.
- Community requests do not expose tokens in logs.
- Missing discussion service produces honest unavailable state.

## Phase 9: Admin, SEO/OG, I18n, Production Launch Ladder

Goal:

Prepare public launch depth after core flows are safe.

Actions:

- Add admin only after auth/admin trust model is explicit.
- Add OG routes and share cards.
- Add structured data.
- Expand zh/en i18n.
- Add live-domain smoke.
- Add launch checklist.
- Add load smoke with dry-run financial flows only.

Verification:

```bash
cd /Users/ricky/Desktop/ChickenDinnerV2/app
pnpm run lint:check
pnpm run typecheck
pnpm run test:unit
pnpm run test:e2e
pnpm run check:reference-boundaries
pnpm run check:no-fake-market-data
pnpm run check:live-trading-safety
pnpm run check:live-topup-safety
pnpm run check:production-env-safety
pnpm run check:polymarket-production-data
```

Exit criteria:

- No fake market data.
- No source-boundary violations.
- No public secret exposure.
- No live submit unless every gate passes.
- Public routes render.
- Account routes do not cache private data.

## Immediate Command Ladder

Run after every implementation phase:

```bash
cd /Users/ricky/Desktop/ChickenDinnerV2/app
pnpm run check:reference-boundaries
pnpm run check:no-fake-market-data
pnpm run check:live-trading-safety
pnpm run check:live-topup-safety
pnpm run check:production-env-safety
pnpm run typecheck
pnpm run test:unit
```

Run before any production claim:

```bash
cd /Users/ricky/Desktop/ChickenDinnerV2/app
pnpm run check:polymarket-production-data
pnpm run test:e2e
pnpm run build
```

Run only with explicit operator-approved non-production load settings:

```bash
cd /Users/ricky/Desktop/ChickenDinnerV2/app
pnpm run check:production-env-safety
```

## Non-Negotiable Rules

1. Do not import from `ChickenV1`.
2. Do not import from `Kuest`.
3. Do not port Kuest backend/trading runtime.
4. Do not port V1 payout executor.
5. Do not port local env values.
6. Do not add fake market, balance, position, PnL, or chart data.
7. Do not enable live submit without explicit operator confirmation.
8. Do not submit a trade unless the user/operator explicitly selects market, outcome, side, price, and size.
9. Do not weaken kill switches.
10. Do not cache private account responses.
