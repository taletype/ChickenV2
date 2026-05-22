import {
  Info,
  Search,
} from "lucide-react";
import { Suspense } from "react";
import { Link } from "@/i18n/navigation";
import { getLocalizedPolymarketFeedPath } from "@/features/prediction/routes";
import { MobileBottomNav } from "./mobile-bottom-nav";
import { WalletConnectButton } from "./wallet-connect-button";
import { WalletRouteSync } from "./wallet-route-sync";

export function PredictionShell({
  children,
  locale
}: {
  children: React.ReactNode;
  locale: string;
}) {
  const isZh = locale.toLowerCase().startsWith("zh");
  const searchLabel = isZh ? "搜尋市場" : "Search markets";

  return (
    <div className="min-h-screen pb-[72px] lg:pb-0">
      <Suspense fallback={null}>
        <WalletRouteSync />
      </Suspense>
      <header className="sticky top-0 z-30 bg-[var(--background)]">
        <div className="app-container relative z-50 flex min-h-[60px] w-full items-center justify-between gap-2 py-3 pb-1 md:min-h-[68px] md:gap-4 md:pb-2">
          <Link
            href="/polymarket"
            className="focus-ring flex h-10 min-w-0 shrink items-center gap-2 text-[22px] font-medium text-[var(--foreground)] transition-opacity hover:opacity-80 md:shrink-0 md:text-2xl"
          >
            <span className="grid size-8 place-items-center rounded-md bg-[var(--foreground)] text-xs font-bold text-white">
              CD
            </span>
            <span className="truncate">Chicken Dinner</span>
          </Link>

          <div className="hidden w-full items-center gap-2 lg:flex">
            <form
              action={getLocalizedPolymarketFeedPath(locale)}
              className="relative w-full max-w-[520px] min-w-[360px]"
              role="search"
            >
              <Search
                className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[var(--muted-foreground)]"
                aria-hidden="true"
              />
              <input
                type="search"
                name="search"
                aria-label={searchLabel}
                placeholder={isZh ? "搜尋" : "Search"}
                className="h-10 w-full rounded-md border border-transparent bg-[var(--accent)] py-1 pl-10 pr-10 text-sm text-[var(--foreground)] outline-none transition-colors placeholder:text-[var(--muted-foreground)] hover:bg-[var(--muted)] focus:border-[var(--border)] focus:bg-[var(--background)]"
              />
              <button
                type="submit"
                aria-label={searchLabel}
                className="focus-ring absolute right-2 top-1/2 inline-flex size-7 -translate-y-1/2 items-center justify-center rounded-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
              >
                <Search className="size-4" aria-hidden="true" />
              </button>
            </form>
            <button className="focus-ring inline-flex h-9 shrink-0 items-center justify-center gap-2 rounded-sm px-4 py-2 text-sm font-medium text-[var(--foreground)] transition-colors hover:bg-[var(--accent)]">
              <Info className="size-4" aria-hidden="true" />
              {isZh ? "運作方式" : "How it works"}
            </button>
          </div>

          <div className="flex min-w-fit shrink-0 items-center gap-2">
            <WalletConnectButton />
          </div>
        </div>
      </header>

      <main>{children}</main>

      <Suspense fallback={<div aria-hidden="true" className="lg:hidden" style={{ height: "calc(env(safe-area-inset-bottom) + 4.125rem + 0.25rem + 1px)" }} />}>
        <MobileBottomNav locale={locale} />
      </Suspense>
    </div>
  );
}
