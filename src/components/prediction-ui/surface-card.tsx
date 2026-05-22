import type { LucideIcon } from "lucide-react";

export function SurfaceHeader({
  eyebrow,
  title,
  description,
  icon: Icon
}: {
  eyebrow: string;
  title: string;
  description: string;
  icon: LucideIcon;
}) {
  return (
    <header className="grid gap-2">
      <div className="flex items-center gap-2 text-sm font-semibold text-[var(--muted-foreground)]">
        <Icon className="size-4" aria-hidden="true" />
        <span>{eyebrow}</span>
      </div>
      <h1 className="text-3xl font-bold tracking-tight text-[var(--foreground)]">
        {title}
      </h1>
      <p className="max-w-2xl text-sm leading-6 text-[var(--muted-foreground)]">
        {description}
      </p>
    </header>
  );
}

export function SurfaceCard({
  title,
  description,
  children
}: {
  title: string;
  description?: string;
  children?: React.ReactNode;
}) {
  return (
    <section className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-4 shadow-[var(--panel-shadow)]">
      <div className="grid gap-1">
        <h2 className="text-base font-semibold text-[var(--foreground)]">{title}</h2>
        {description ? (
          <p className="text-sm leading-6 text-[var(--muted-foreground)]">
            {description}
          </p>
        ) : null}
      </div>
      {children ? <div className="mt-4">{children}</div> : null}
    </section>
  );
}

export function UnavailableState({
  title,
  description,
  reason
}: {
  title: string;
  description: string;
  reason?: string | null;
}) {
  return (
    <div className="grid min-h-[220px] place-items-center rounded-lg border border-dashed border-[var(--border)] bg-[var(--card)] px-4 py-10 text-center">
      <div className="max-w-lg">
        <h2 className="text-sm font-bold text-[var(--foreground)]">{title}</h2>
        <p className="mt-2 text-sm leading-6 text-[var(--muted-foreground)]">
          {description}
        </p>
        {reason ? (
          <p className="mt-3 font-mono text-xs text-[var(--muted-foreground)]">
            {reason}
          </p>
        ) : null}
      </div>
    </div>
  );
}
