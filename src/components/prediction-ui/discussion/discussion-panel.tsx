import { MessageCircle, ShieldAlert, SlidersHorizontal } from "lucide-react";
import type { PredictionDiscussionViewModel } from "@/features/prediction/types";
import { DiscussionComposerShell } from "./discussion-composer";
import { DiscussionList } from "./discussion-list";

function isZh(locale?: string) {
  return locale?.toLowerCase().startsWith("zh") ?? false;
}

function stateCopy(viewModel: PredictionDiscussionViewModel, locale?: string) {
  if (viewModel.status === "unavailable") {
    return {
      title: isZh(locale) ? "討論暫不可用" : "Discussion unavailable",
      description: isZh(locale)
        ? "V2 尚未接入由伺服器擁有的討論後端。"
        : "V2 has not connected a server-owned discussion backend for this market."
    };
  }

  return {
    title: isZh(locale) ? "沒有留言" : "No comments returned",
    description: isZh(locale)
      ? "V2 討論 adapter 返回空留言列表時，才會顯示此狀態。"
      : "This state appears only when the V2 discussion adapter returns an empty comment list."
  };
}

export function DiscussionPanel({
  discussion,
  locale
}: {
  discussion: PredictionDiscussionViewModel;
  locale?: string;
}) {
  const hasComments = discussion.status === "ready" && discussion.comments.length > 0;
  const copy = stateCopy(discussion, locale);

  return (
    <section className="grid gap-3" data-testid="prediction-discussion-panel">
      <DiscussionComposerShell locale={locale} />

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          disabled
          className="inline-flex h-9 cursor-not-allowed items-center gap-1.5 rounded-md border border-[var(--border)] bg-[var(--card)] px-3 text-sm font-semibold text-[var(--muted-foreground)]"
        >
          <SlidersHorizontal className="size-4" aria-hidden="true" />
          {isZh(locale) ? "最新" : "Newest"}
        </button>
        <button
          type="button"
          disabled
          className="inline-flex h-9 cursor-not-allowed items-center rounded-md border border-[var(--border)] bg-[var(--card)] px-3 text-sm font-semibold text-[var(--muted-foreground)]"
        >
          {isZh(locale) ? "持倉者" : "Holders"}
        </button>
        <span className="ml-auto inline-flex min-h-9 items-center gap-1.5 rounded-md border border-[var(--border)] bg-[var(--muted)] px-3 text-xs font-semibold text-[var(--muted-foreground)]">
          <ShieldAlert className="size-4" aria-hidden="true" />
          {isZh(locale) ? "留意外部連結" : "Beware of external links"}
        </span>
      </div>

      {hasComments ? (
        <DiscussionList comments={discussion.comments} locale={locale} />
      ) : (
        <div
          className="grid min-h-[220px] place-items-center rounded-lg border border-dashed border-[var(--border)] bg-[var(--card)] px-4 py-10 text-center"
          data-testid="discussion-state"
        >
          <div className="max-w-md space-y-3">
            <div className="mx-auto grid size-11 place-items-center rounded-full bg-[var(--muted)] text-[var(--muted-foreground)]">
              <MessageCircle className="size-5" aria-hidden="true" />
            </div>
            <div>
              <p className="text-sm font-bold text-[var(--foreground)]">{copy.title}</p>
              <p className="mt-1 text-sm leading-6 text-[var(--muted-foreground)]">
                {copy.description}
              </p>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
