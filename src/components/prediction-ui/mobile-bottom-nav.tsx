"use client";

import {
  BarChart3,
  BookOpen,
  House,
  Menu,
  Search,
  Settings,
  Sparkles,
  Trophy,
  X
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { usePathname } from "@/i18n/navigation";
import {
  getLocalizedPolymarketFeedPath,
  getPredictionMobileNavItems
} from "@/features/prediction/routes";

function localeKey(locale: string) {
  return locale.toLowerCase().startsWith("zh") ? "zh" : "en";
}

function normalizePathname(pathname: string) {
  const parts = pathname.split("/").filter(Boolean);
  if (parts[0] === "en" || parts[0] === "zh") {
    return `/${parts.slice(1).join("/")}`;
  }

  return pathname || "/";
}

export function MobileBottomNav({ locale }: { locale: string }) {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const pathname = normalizePathname(usePathname());
  const searchParams = useSearchParams();
  const activeSort = searchParams.get("sort");
  const items = getPredictionMobileNavItems(locale);
  const labels: {
    search: string;
    searchMarkets: string;
    close: string;
    menu: string;
    closeMenu: string;
    leaderboard: string;
    settings: string;
    docs: string;
  } = localeKey(locale) === "zh"
    ? {
        search: "搜尋",
        searchMarkets: "搜尋市場",
        close: "關閉搜尋",
        menu: "選單",
        closeMenu: "關閉選單",
        leaderboard: "排行榜",
        settings: "設定",
        docs: "文件"
      }
    : {
        search: "Search",
        searchMarkets: "Search markets",
        close: "Close search",
        menu: "Menu",
        closeMenu: "Close menu",
        leaderboard: "Leaderboard",
        settings: "Settings",
        docs: "Docs"
      };

  return (
    <>
      <div aria-hidden="true" className="lg:hidden" style={{ height: "calc(env(safe-area-inset-bottom) + 4.125rem + 0.25rem + 1px)" }} />

      {isSearchOpen ? (
        <div className="fixed inset-0 z-50 bg-black/20 lg:hidden">
          <div className="absolute inset-x-0 bottom-0 max-h-[90dvh] overflow-y-auto rounded-t-[1.25rem] border border-b-0 border-[var(--border)] bg-[var(--background)] px-4 pb-6 pt-4 shadow-[0_-24px_64px_-36px_rgba(15,23,42,0.6)]">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div className="text-sm font-semibold text-[var(--foreground)]">
                {labels.searchMarkets}
              </div>
              <button
                type="button"
                className="focus-ring inline-flex size-9 items-center justify-center rounded-sm text-[var(--muted-foreground)] hover:bg-[var(--accent)] hover:text-[var(--foreground)]"
                aria-label={labels.close}
                onClick={() => setIsSearchOpen(false)}
              >
                <X className="size-4" aria-hidden="true" />
              </button>
            </div>
            <form action={getLocalizedPolymarketFeedPath(locale)} role="search">
              <div className="relative">
                <Search
                  className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[var(--muted-foreground)]"
                  aria-hidden="true"
                />
                <input
                  autoFocus
                  type="search"
                  name="search"
                  aria-label={labels.searchMarkets}
                  placeholder={labels.search}
                  className="h-12 w-full rounded-md border border-[var(--border)] bg-[var(--background)] py-2 pl-10 pr-12 text-base outline-none focus:border-[var(--primary)]"
                />
                <button
                  type="submit"
                  className="focus-ring absolute right-2 top-1/2 inline-flex size-8 -translate-y-1/2 items-center justify-center rounded-sm text-[var(--muted-foreground)] hover:bg-[var(--accent)] hover:text-[var(--foreground)]"
                  aria-label={labels.searchMarkets}
                >
                  <Search className="size-4" aria-hidden="true" />
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {isMenuOpen ? (
        <div className="fixed inset-0 z-50 bg-black/20 lg:hidden">
          <div className="absolute inset-x-0 bottom-0 rounded-t-[1.25rem] border border-b-0 border-[var(--border)] bg-[var(--background)] px-4 pb-6 pt-4 shadow-[0_-24px_64px_-36px_rgba(15,23,42,0.6)]">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div className="text-sm font-semibold text-[var(--foreground)]">
                {labels.menu}
              </div>
              <button
                type="button"
                className="focus-ring inline-flex size-9 items-center justify-center rounded-sm text-[var(--muted-foreground)] hover:bg-[var(--accent)] hover:text-[var(--foreground)]"
                aria-label={labels.closeMenu}
                onClick={() => setIsMenuOpen(false)}
              >
                <X className="size-4" aria-hidden="true" />
              </button>
            </div>
            <div className="grid gap-2">
              <MobileMenuLink
                href={`/${locale}/leaderboard`}
                label={labels.leaderboard}
                icon={Trophy}
              />
              <MobileMenuLink
                href={`/${locale}/settings`}
                label={labels.settings}
                icon={Settings}
              />
              <MobileMenuLink
                href={`/${locale}/docs`}
                label={labels.docs}
                icon={BookOpen}
              />
            </div>
          </div>
        </div>
      ) : null}

      <nav
        className="fixed inset-x-0 bottom-0 z-40 lg:hidden"
        aria-label="Primary navigation"
      >
        <div className="border-t border-[var(--border)] bg-[var(--background)]/95 pb-[calc(env(safe-area-inset-bottom)+0.25rem)] shadow-[0_-20px_48px_-36px_rgba(15,23,42,0.55)] backdrop-blur-sm">
          <div className="grid h-[66px] grid-cols-5">
            <MobileNavLink
              href={items[0]?.href ?? getLocalizedPolymarketFeedPath(locale)}
              label={items[0]?.label ?? "Home"}
              active={pathname === "/polymarket"}
              icon={House}
            />
            <MobileNavButton
              label={labels.search}
              active={isSearchOpen}
              icon={Search}
              onClick={() => setIsSearchOpen(true)}
            />
            <MobileNavLink
              href={items[1]?.href ?? getLocalizedPolymarketFeedPath(locale)}
              label={items[1]?.label ?? "Recent"}
              active={pathname === "/polymarket" && activeSort === "recent"}
              icon={Sparkles}
            />
            <MobileNavLink
              href={items[2]?.href ?? `/${locale}/portfolio`}
              label={items[2]?.label ?? "Portfolio"}
              active={pathname.startsWith("/portfolio")}
              icon={BarChart3}
            />
            <MobileNavButton
              label={labels.menu}
              active={isMenuOpen}
              icon={Menu}
              onClick={() => setIsMenuOpen(true)}
            />
          </div>
        </div>
      </nav>
    </>
  );
}

function MobileNavLink({
  href,
  label,
  icon: Icon,
  active = false
}: {
  href: string;
  label: string;
  icon: LucideIcon;
  active?: boolean;
}) {
  return (
    <a
      href={href}
      aria-current={active ? "page" : undefined}
      className={
        active
          ? "focus-ring flex size-full flex-col items-center justify-center gap-1 px-2 text-[11px] font-semibold leading-none text-[var(--foreground)] transition-colors"
          : "focus-ring flex size-full flex-col items-center justify-center gap-1 px-2 text-[11px] font-semibold leading-none text-[var(--muted-foreground)] transition-colors"
      }
    >
      <Icon className="size-[17px]" aria-hidden="true" />
      <span className="max-w-full truncate">{label}</span>
    </a>
  );
}

function MobileNavButton({
  label,
  icon: Icon,
  active,
  onClick
}: {
  label: string;
  icon: LucideIcon;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      className={
        active
          ? "focus-ring flex size-full flex-col items-center justify-center gap-1 px-2 text-[11px] font-semibold leading-none text-[var(--foreground)] transition-colors"
          : "focus-ring flex size-full flex-col items-center justify-center gap-1 px-2 text-[11px] font-semibold leading-none text-[var(--muted-foreground)] transition-colors"
      }
      aria-label={label}
      onClick={onClick}
    >
      <Icon className="size-[17px]" aria-hidden="true" />
      <span>{label}</span>
    </button>
  );
}

function MobileMenuLink({
  href,
  label,
  icon: Icon
}: {
  href: string;
  label: string;
  icon: LucideIcon;
}) {
  return (
    <a
      href={href}
      className="focus-ring flex h-12 items-center gap-3 rounded-md border border-[var(--border)] px-3 text-sm font-semibold text-[var(--foreground)] hover:bg-[var(--accent)]"
    >
      <Icon className="size-4 text-[var(--muted-foreground)]" aria-hidden="true" />
      <span>{label}</span>
    </a>
  );
}
