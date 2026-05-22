import {
  BarChart3,
  House,
  Info,
  Search,
  Sparkles,
  TrendingUp
} from "lucide-react";
import { Link } from "@/i18n/navigation";

export function PredictionShell({
  children,
  locale: _locale
}: {
  children: React.ReactNode;
  locale: string;
}) {
  return (
    <div className="min-h-screen pb-[72px] lg:pb-0">
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
            <div className="relative w-full max-w-[360px]">
              <Search
                className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[var(--muted-foreground)]"
                aria-hidden="true"
              />
              <div className="h-9 rounded-md border border-transparent bg-[var(--accent)] pl-10 pr-3 text-sm leading-9 text-[var(--muted-foreground)] transition-colors hover:bg-[var(--muted)]">
                Search
              </div>
            </div>
            <button className="focus-ring inline-flex h-9 shrink-0 items-center justify-center gap-2 rounded-sm px-4 py-2 text-sm font-medium text-[var(--foreground)] transition-colors hover:bg-[var(--accent)]">
              <Info className="size-4" aria-hidden="true" />
              How it works
            </button>
          </div>

          <div className="flex min-w-fit shrink-0 items-center gap-2">
            <button className="focus-ring inline-flex h-9 shrink-0 items-center justify-center rounded-sm px-3 py-2 text-sm font-medium whitespace-nowrap text-[var(--primary)] no-underline transition-colors hover:bg-[var(--accent)] md:px-4">
              Log In
            </button>
            <button className="focus-ring inline-flex h-9 shrink-0 items-center justify-center rounded-sm bg-[var(--primary)] px-3 py-2 text-sm font-medium whitespace-nowrap text-white shadow-sm transition-colors hover:bg-[color-mix(in_srgb,var(--primary)_90%,black)] md:px-4">
              Sign Up
            </button>
          </div>
        </div>
      </header>

      <main>{children}</main>

      <nav
        className="fixed inset-x-0 bottom-0 z-40 lg:hidden"
        aria-label="Primary navigation"
      >
        <div className="border-t border-[var(--border)] bg-[var(--background)]/95 pb-[calc(env(safe-area-inset-bottom)+0.25rem)] shadow-[0_-20px_48px_-36px_rgba(15,23,42,0.55)] backdrop-blur-sm">
          <div className="grid h-[66px] grid-cols-4">
            <MobileNavLink href="/polymarket" label="Home" active icon={House} />
            <MobileNavButton label="Search" icon={Search} />
            <MobileNavLink href="/polymarket?category=trending" label="New" icon={Sparkles} />
            <MobileNavLink href="/portfolio" label="Portfolio" icon={BarChart3} />
          </div>
        </div>
      </nav>
    </div>
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
  icon: typeof House;
  active?: boolean;
}) {
  return (
    <Link
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
    </Link>
  );
}

function MobileNavButton({
  label,
  icon: Icon
}: {
  label: string;
  icon: typeof TrendingUp;
}) {
  return (
    <button
      type="button"
      className="focus-ring flex size-full flex-col items-center justify-center gap-1 px-2 text-[11px] font-semibold leading-none text-[var(--muted-foreground)] transition-colors"
      aria-label={label}
    >
      <Icon className="size-[17px]" aria-hidden="true" />
      <span>{label}</span>
    </button>
  );
}
