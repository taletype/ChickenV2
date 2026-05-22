import { Flag, Heart, MessageSquareReply, MoreHorizontal } from "lucide-react";
import type {
  PredictionDiscussionComment,
  PredictionDiscussionReply
} from "@/features/prediction/types";

function isZh(locale?: string) {
  return locale?.toLowerCase().startsWith("zh") ?? false;
}

function formatDate(value: string | null, locale?: string) {
  if (!value) {
    return "--";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString(locale ?? "en", {
    month: "short",
    day: "numeric",
    year: "numeric"
  });
}

function displayAuthor(
  authorLabel: string | null,
  authorAddress: string | null,
  locale?: string
) {
  return authorLabel?.trim() || authorAddress?.trim() || (isZh(locale) ? "用戶不可用" : "User unavailable");
}

function ReactionMeta({
  likesCount,
  repliesCount,
  viewerHasLiked,
  locale
}: {
  likesCount: number | null;
  repliesCount: number | null;
  viewerHasLiked: boolean | null;
  locale?: string;
}) {
  return (
    <div className="mt-2 flex flex-wrap items-center gap-2 text-xs font-semibold text-[var(--muted-foreground)]">
      {likesCount !== null ? (
        <span className="inline-flex items-center gap-1">
          <Heart
            className={
              viewerHasLiked
                ? "size-3.5 fill-current text-[var(--no)]"
                : "size-3.5"
            }
            aria-hidden="true"
          />
          {likesCount}
        </span>
      ) : null}
      {repliesCount !== null ? (
        <span className="inline-flex items-center gap-1">
          <MessageSquareReply className="size-3.5" aria-hidden="true" />
          {repliesCount}
        </span>
      ) : null}
      {likesCount === null && repliesCount === null ? (
        <span>{isZh(locale) ? "互動數據未返回" : "Engagement counts not returned"}</span>
      ) : null}
    </div>
  );
}

function ReplyRow({
  reply,
  locale
}: {
  reply: PredictionDiscussionReply;
  locale?: string;
}) {
  return (
    <div className="ml-6 border-l border-[var(--border)] pl-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex min-w-0 flex-wrap items-center gap-2">
            <span className="truncate text-sm font-bold text-[var(--foreground)]">
              {displayAuthor(reply.authorLabel, reply.authorAddress, locale)}
            </span>
            <span className="text-xs font-medium text-[var(--muted-foreground)]">
              {formatDate(reply.createdAt, locale)}
            </span>
          </div>
          <p className="mt-1 whitespace-pre-line text-sm leading-6 text-[var(--foreground)]">
            {reply.body}
          </p>
          <ReactionMeta
            likesCount={reply.likesCount}
            repliesCount={null}
            viewerHasLiked={reply.viewerHasLiked}
            locale={locale}
          />
        </div>
      </div>
    </div>
  );
}

function CommentRow({
  comment,
  locale
}: {
  comment: PredictionDiscussionComment;
  locale?: string;
}) {
  return (
    <article className="grid gap-3 border-b border-[var(--border)] px-3 py-4 last:border-b-0 sm:px-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex min-w-0 flex-wrap items-center gap-2">
            <span className="truncate text-sm font-bold text-[var(--foreground)]">
              {displayAuthor(comment.authorLabel, comment.authorAddress, locale)}
            </span>
            <span className="text-xs font-medium text-[var(--muted-foreground)]">
              {formatDate(comment.createdAt, locale)}
            </span>
          </div>
          <p className="mt-1 whitespace-pre-line text-sm leading-6 text-[var(--foreground)]">
            {comment.body}
          </p>
          <ReactionMeta
            likesCount={comment.likesCount}
            repliesCount={comment.repliesCount}
            viewerHasLiked={comment.viewerHasLiked}
            locale={locale}
          />
        </div>
        {comment.canDelete || comment.canReport ? (
          <div className="flex shrink-0 items-center gap-1">
            {comment.canReport ? (
              <button
                type="button"
                disabled
                className="grid size-8 cursor-not-allowed place-items-center rounded-md text-[var(--muted-foreground)]"
                aria-label={isZh(locale) ? "檢舉暫不可用" : "Report unavailable"}
              >
                <Flag className="size-4" aria-hidden="true" />
              </button>
            ) : null}
            {comment.canDelete ? (
              <button
                type="button"
                disabled
                className="grid size-8 cursor-not-allowed place-items-center rounded-md text-[var(--muted-foreground)]"
                aria-label={isZh(locale) ? "更多選項暫不可用" : "More options unavailable"}
              >
                <MoreHorizontal className="size-4" aria-hidden="true" />
              </button>
            ) : null}
          </div>
        ) : null}
      </div>

      {comment.replies.length > 0 ? (
        <div className="grid gap-3">
          {comment.replies.map((reply) => (
            <ReplyRow key={reply.id} reply={reply} locale={locale} />
          ))}
        </div>
      ) : null}
    </article>
  );
}

export function DiscussionList({
  comments,
  locale
}: {
  comments: PredictionDiscussionComment[];
  locale?: string;
}) {
  if (comments.length === 0) {
    return null;
  }

  return (
    <div className="overflow-hidden rounded-lg border border-[var(--border)] bg-[var(--card)]">
      {comments.map((comment) => (
        <CommentRow key={comment.id} comment={comment} locale={locale} />
      ))}
    </div>
  );
}
