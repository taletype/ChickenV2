# Kuest Audit

## Verdict

Kuest is a strong UX and product reference.

Kuest is not a safe backend or trading-runtime reference for V2.

Use Kuest to rebuild screens and interactions. Do not port its auth, DB, trading, migration, CLOB, or credential code.

## Inspected Areas

- `Kuest/package.json`
- `Kuest/.env.example`
- `Kuest/src/app/[locale]/(platform)`
- `Kuest/src/app/api`
- `Kuest/src/components`
- `Kuest/src/hooks`
- `Kuest/src/lib`
- `Kuest/scripts`
- `Kuest/tests`

## Severity Table

| Severity | Finding | Evidence | V2 Action |
|---|---|---|---|
| Critical | Kuest directly posts orders to CLOB with KUEST credential headers. | `src/app/[locale]/(platform)/event/[slug]/_actions/store-order.ts`. | Do not port. |
| Critical | Kuest auth/runtime stack conflicts with V2 boundaries. | `better-auth`, `drizzle-orm`, `postgres`, `src/lib/auth.ts`, `src/lib/db/*`. | Do not port. |
| High | Kuest `.env.example` expects KUEST credentials, Better Auth secret, Postgres, Supabase service role, S3, and event signer private keys. | `.env.example`. | Do not reuse. |
| High | Client discussion hook uses `process.env.COMMUNITY_URL!` in client code. | `src/app/[locale]/(platform)/event/[slug]/_hooks/useInfiniteComments.ts`. | Rebuild through a V2 server proxy/public config. |
| High | Test/demo branding is present. | `src/components/TestModeBanner.tsx`, `demo.kuest.com` strings. | Remove from V2. |
| Medium | Kuest product UI is rich but tightly coupled to DB/auth/user models. | Feed, event, portfolio, admin route trees. | Rebuild UX with V2 view models. |
| Medium | Kuest has admin/event creation/editor capability that is useful but too large for first V2 phases. | `src/app/[locale]/admin/*`, `src/lib/event-creation*`. | Nice-to-port later. |
| Medium | Kuest image/OG/social infrastructure is useful but not core to trading launch. | `src/app/api/og/*`, share/profile routes. | Port after core flows. |
| Low | Kuest tests can inspire component coverage, but names and stack assumptions differ. | `tests/unit`, `tests/e2e`. | Rewrite tests for V2. |

## Product Features Worth Rebuilding

### Home / Feed

Worth rebuilding:

- Dynamic category sidebar.
- Secondary navigation.
- Filter toolbar.
- Search input.
- Event card grid.
- Event card header/footer/market list.
- Sports moneyline cards.
- Skeleton and empty states.
- Route-aware category selection.

Evidence:

- `src/app/[locale]/(platform)/(home)/_components/HomeClient.tsx`
- `CategorySidebar.tsx`
- `FilterToolbar.tsx`
- `EventsGrid.tsx`
- `EventCard*.tsx`

V2 implementation rule:

Use V2 `PredictionMarketFeedViewModel` and Polymarket production data. Do not import Kuest event models.

### Market Detail

Worth rebuilding:

- Rich market header.
- Outcome rows.
- Market tabs.
- Rules section.
- Activity section.
- Order book.
- Top holders.
- Related markets.
- FAQ and metadata panels.
- Mobile order panel layout.

Evidence:

- `src/app/[locale]/(platform)/event/[slug]/_components/*`

V2 implementation rule:

Use V2 market detail adapter, V2 order validation, and V2 fail-closed trade ticket. Do not port Kuest order actions.

### Navigation

Worth rebuilding:

- Header search.
- Mobile bottom nav.
- More menu.
- Profile menu shell.
- Wallet modal layout.

Evidence:

- `src/app/[locale]/(platform)/_components/Header.tsx`
- `MobileBottomNav.tsx`
- `HeaderSearch.tsx`
- `WalletModal.tsx`

V2 implementation rule:

Keep V2 wallet/AppKit boundary and Reown config.

### Portfolio

Worth rebuilding:

- Portfolio hero.
- Position summary cards.
- Open orders list/table.
- Wallet actions.
- PnL presentation.
- Markets won card.
- Public profile overlap.

Evidence:

- `src/app/[locale]/(platform)/portfolio/page.tsx`
- `PortfolioTabs.tsx`
- `PortfolioOpenOrders*`
- `PublicProfileHeroCards.tsx`

V2 implementation rule:

Use V2 Polymarket account APIs and analytics adapters. Do not port Kuest DB queries.

### Admin / Creator

Worth considering later:

- Event calendar creation flow.
- Category/theme settings.
- Locales settings.
- Market context editing.
- Allowed market creators management.

Evidence:

- `src/app/[locale]/admin/*`
- `src/lib/event-creation*`
- `src/lib/ai/market-context*`

V2 implementation rule:

Only after V2 has stable auth/admin requirements.

## Chart UX Inventory

Kuest chart assets worth rebuilding:

- `EventChart.tsx`
- `EventChartCanvas.tsx`
- `EventChartControls.tsx`
- `EventChartControlsBar.tsx`
- `EventChartEmbedDialog.tsx`
- `EventChartExportDialog.tsx`
- `EventChartHeader.tsx`
- `EventChartLayout.tsx`
- `EventChartLegend.tsx`
- `EventChartSection.tsx`
- `EventChartTradeFlow.tsx`
- `EventLiveSeriesChart.tsx`
- `EventLiveSeriesChartHeader.tsx`
- `EventLiveSeriesChartOverlay.tsx`
- `EventLiveSeriesViewSwitch.tsx`
- chart hooks and utilities under `_hooks` and `_utils`.

Feature inventory:

- Multi-series chart.
- Live series chart fallback.
- Mobile-specific chart behavior.
- Trade-flow overlay labels.
- Controls and time ranges.
- Export/embed dialogs.
- Chart legend.
- Live WebSocket hooks.

Do not port:

- Direct Kuest event types.
- DB-specific live chart config queries.
- Any trading side effects tied to chart interactions.

## Discussion UX Inventory

Kuest discussion assets worth rebuilding:

- `EventComments.tsx`
- `EventCommentForm.tsx`
- `EventCommentItem.tsx`
- `EventCommentReplyItem.tsx`
- `EventCommentLikeForm.tsx`
- `EventCommentDeleteForm.tsx`
- `EventCommentPositionsIndicator.tsx`
- `useInfiniteComments.ts`

Feature inventory:

- Infinite scroll.
- Newest/top sort.
- Holders-only filter.
- Replies.
- Likes.
- Delete.
- Optimistic comment insert.
- Optimistic reply insert.
- Wallet signature prompt for community token.
- Positions indicator.

Do not port as-is:

- Client-side `process.env.COMMUNITY_URL!`.
- Kuest community token assumptions.
- Kuest user/deposit wallet model.

V2 target:

Use a V2 server proxy or V2 community adapter with public-safe env and no secret exposure.

## Feed UX Inventory

Kuest feed assets worth rebuilding:

- `HomeClient.tsx`
- `HomeContent.tsx`
- `EventsGrid.tsx`
- `EventsStaticGrid.tsx`
- `EventCard.tsx`
- `EventCardMarketsList.tsx`
- `EventCardSingleMarketActions.tsx`
- `EventCardSportsMoneyline.tsx`
- `FilterToolbar.tsx`
- `FilterSettingsRow.tsx`
- `FilterToolbarSearchInput.tsx`
- `CategorySidebar.tsx`
- `HomeSecondaryNavigation.tsx`

Feature inventory:

- Category path awareness.
- Main/child tag navigation.
- Sidebar for category paths.
- Bookmarked filter.
- Search.
- Static initial events with client filter state.
- Skeletons and empty states.

V2 target:

Keep V2 `MarketFeedViewModel`. Add category/search/filter parameters only after production-data queries remain safe.

## Portfolio UX Inventory

Kuest portfolio assets worth rebuilding:

- `PortfolioTabs.tsx`
- `PortfolioWalletActions.tsx`
- `PortfolioOpenOrdersFilters.tsx`
- `PortfolioOpenOrdersList.tsx`
- `PortfolioOpenOrdersTable.tsx`
- `PortfolioOpenOrdersRow.tsx`
- `PortfolioMarketsWonCard.tsx`
- `PublicProfileHeroCards.tsx`
- public activity/positions components.

Feature inventory:

- Position list/table.
- Open orders.
- Public profile stats.
- PnL chart.
- Wallet action controls.
- Markets won.
- Shareable/profile-oriented UX.

V2 target:

Port after account APIs and signed-submit attempt persistence exist.

## Forbidden Backend / Trading / Runtime Logic

Do not port:

1. `src/app/[locale]/(platform)/event/[slug]/_actions/store-order.ts`.
2. `src/app/[locale]/(platform)/_actions/approve-tokens.ts`.
3. `src/app/[locale]/(platform)/_actions/deposit-wallet.ts`.
4. `src/lib/auth.ts`.
5. `src/lib/db/*`.
6. `src/lib/drizzle.ts`.
7. `src/lib/trading-auth/*`.
8. `scripts/migrate.ts`.
9. `KUEST_*` credential env.
10. `BETTER_AUTH_SECRET`.
11. `POSTGRES_URL`.
12. `SUPABASE_SERVICE_ROLE_KEY`.
13. `S3_SECRET_ACCESS_KEY`.
14. `EVENT_CREATION_SIGNER_PRIVATE_KEYS`.
15. Any direct CLOB HMAC submit with KUEST headers.

Reason:

V2 needs Polymarket-adapter-first, fail-closed, source-separated runtime logic. Kuest backend assumptions are a different product architecture.

## Fake / Demo Data Risks

Kuest has explicit test/demo residue:

- `TestModeBanner.tsx` says test mode is on and references Amoy USDC faucet.
- i18n strings include `demo.kuest.com`.
- `.env.example` tells operators to get Kuest CLOB auth credentials at `auth.kuest.com`.
- Placeholder/demo strings exist in admin forms.

Risk:

These strings can leak into public V2 copy and create fake/trust issues.

Action:

Do not copy Kuest messages directly. Recreate copy under Chicken Dinner branding and V2 live/fail-closed posture.

## Security Findings

Kuest auth stack:

- Better Auth.
- SIWE.
- Two factor.
- Drizzle Postgres adapter.
- Session cookies.
- Anonymous SIWE mode.
- User table additional fields.

Risk:

Strong product surface, but not a small port. It changes V2 data ownership, auth session model, admin trust model, and credential storage.

Action:

Treat as reference only.

## Test Findings

Kuest has unit/e2e tests, but no repo-native live-trading safety ladder equivalent to V1/V2 was identified in package scripts.

Do not use Kuest passing tests as live-trading confidence.

## Porting Verdict

Must port from Kuest:

1. Feed layout patterns.
2. Chart UI affordances.
3. Discussion UX.
4. Portfolio UX.
5. Mobile navigation patterns.

Nice to port later:

1. Admin event calendar.
2. Theme editor.
3. OG image routes.
4. Leaderboards.
5. Profile pages.
6. Embeds.
7. Docs pages.

Do not port:

1. Backend runtime.
2. Auth runtime.
3. DB schema.
4. Direct CLOB order submit.
5. Test/demo copy.
6. KUEST credentials.
7. Migration script.
8. Storage service logic.
9. Event signer private keys.
10. Client-side non-public env reads.
