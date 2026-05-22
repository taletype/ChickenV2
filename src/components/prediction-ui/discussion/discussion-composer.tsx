import { LockKeyhole } from "lucide-react";

function isZh(locale?: string) {
  return locale?.toLowerCase().startsWith("zh") ?? false;
}

export function DiscussionComposerShell({ locale }: { locale?: string }) {
  const inputLabel = isZh(locale) ? "留言內容" : "Comment content";
  const submitLabel = isZh(locale) ? "暫不可發布" : "Post unavailable";

  return (
    <div className="grid gap-2">
      <div className="relative">
        <textarea
          aria-label={inputLabel}
          className="min-h-20 w-full resize-none rounded-lg border border-[var(--border)] bg-[var(--muted)] px-3 py-2 pr-28 text-sm text-[var(--muted-foreground)] outline-none"
          disabled
          readOnly
          value=""
          placeholder={
            isZh(locale)
              ? "討論功能需要 V2 擁有的後端。"
              : "Discussion requires a V2-owned backend."
          }
        />
        <button
          type="button"
          disabled
          className="absolute bottom-3 right-3 inline-flex h-8 cursor-not-allowed items-center justify-center gap-1.5 rounded-md border border-[var(--border)] bg-[var(--card)] px-2.5 text-xs font-bold text-[var(--muted-foreground)]"
        >
          <LockKeyhole className="size-3.5" aria-hidden="true" />
          {submitLabel}
        </button>
      </div>
    </div>
  );
}
