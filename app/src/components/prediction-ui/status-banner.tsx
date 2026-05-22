import { AlertCircle, CheckCircle2, Clock3 } from "lucide-react";

export function StatusBanner({
  status,
  children
}: {
  status: "ready" | "empty" | "unavailable" | "stale";
  children: React.ReactNode;
}) {
  const Icon =
    status === "ready" ? CheckCircle2 : status === "stale" ? Clock3 : AlertCircle;

  return (
    <div className="flex items-center gap-3 rounded-xl border border-[var(--border)] bg-[var(--card)] px-4 py-3 text-sm text-[var(--muted-foreground)]">
      <Icon className="size-4 shrink-0 text-[var(--primary)]" aria-hidden="true" />
      <div>{children}</div>
    </div>
  );
}
