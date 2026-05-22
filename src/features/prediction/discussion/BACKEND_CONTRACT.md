# V2 Discussion Backend Contract

Before discussion posting can be enabled, V2 needs a server-owned backend that covers:

- Wallet/user identity resolved server-side from the active wallet session.
- Per-wallet and per-market rate limits.
- Moderation/reporting flows with auditable review outcomes.
- Delete/hide controls that do not trust client-only ownership claims.
- Spam controls before persistence and before client fan-out.
- Server-owned persistence for comments, replies, reactions, reports, and moderation state.

Until that contract exists, V2 discussion surfaces must render unavailable instead of inventing comments, users, reactions, or counts.
