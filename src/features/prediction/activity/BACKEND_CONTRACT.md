# V2 Activity And Open Orders Backend Contract

Before account activity or open orders can move beyond unavailable shells, V2 needs:

- Wallet/user identity resolved server-side for every account-scoped read.
- Verified upstream reads or server-owned persistence for fills, orders, and account activity.
- Explicit market/account scoping so private account rows do not leak across routes.
- Empty states only when the verified adapter returns no rows.
- Rate limits for account-scoped endpoints.
- Cancel/delete/hide/write controls kept behind server-side authorization and audit trails.

Until that exists, V2 activity and open-orders surfaces must render unavailable instead of inventing account, activity, order, fill, or balance rows.
