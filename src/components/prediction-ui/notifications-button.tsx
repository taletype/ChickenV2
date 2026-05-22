"use client";

import { Bell, X } from "lucide-react";
import { useState } from "react";
import type { PredictionNotificationInboxViewModel } from "@/features/prediction/types";

function isZh(locale: string) {
  return locale.toLowerCase().startsWith("zh");
}

export function NotificationsButton({
  inbox,
  locale
}: {
  inbox: PredictionNotificationInboxViewModel;
  locale: string;
}) {
  const [open, setOpen] = useState(false);
  const labels = isZh(locale)
    ? {
        open: "開啟通知",
        close: "關閉通知",
        title: "通知",
        unavailableTitle: "通知暫不可用",
        unavailableDescription: "V2 尚未接入伺服器擁有的通知 adapter，因此不顯示假未讀數或提醒。",
        emptyTitle: "沒有通知",
        emptyDescription: "只有在 adapter 返回空通知列表時才會顯示此狀態。"
      }
    : {
        open: "Open notifications",
        close: "Close notifications",
        title: "Notifications",
        unavailableTitle: "Notifications unavailable",
        unavailableDescription: "V2 has not connected a server-owned notification adapter, so fake unread counts or alerts are not shown.",
        emptyTitle: "No notifications",
        emptyDescription: "This state appears only when the adapter returns an empty notification list."
      };

  const hasUnread = inbox.status === "ready" && (inbox.unreadCount ?? 0) > 0;
  const stateTitle =
    inbox.status === "unavailable" ? labels.unavailableTitle : labels.emptyTitle;
  const stateDescription =
    inbox.status === "unavailable" ? labels.unavailableDescription : labels.emptyDescription;

  return (
    <div className="relative">
      <button
        type="button"
        className="focus-ring relative inline-flex size-9 items-center justify-center rounded-md border border-[var(--border)] text-[var(--muted-foreground)] transition-colors hover:bg-[var(--accent)] hover:text-[var(--foreground)]"
        aria-label={labels.open}
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
      >
        <Bell className="size-4" aria-hidden="true" />
        {hasUnread ? (
          <span className="absolute right-1.5 top-1.5 size-2 rounded-full bg-[var(--primary)]" />
        ) : null}
      </button>

      {open ? (
        <div className="absolute right-0 top-11 z-50 w-[min(22rem,calc(100vw-2rem))] overflow-hidden rounded-lg border border-[var(--border)] bg-[var(--card)] shadow-[var(--panel-shadow)]">
          <div className="flex items-center justify-between gap-3 border-b border-[var(--border)] px-3 py-2">
            <h2 className="text-sm font-semibold text-[var(--foreground)]">
              {labels.title}
            </h2>
            <button
              type="button"
              className="focus-ring inline-flex size-7 items-center justify-center rounded-sm text-[var(--muted-foreground)] hover:bg-[var(--accent)] hover:text-[var(--foreground)]"
              aria-label={labels.close}
              onClick={() => setOpen(false)}
            >
              <X className="size-4" aria-hidden="true" />
            </button>
          </div>

          {inbox.status === "ready" && inbox.notifications.length > 0 ? (
            <div className="max-h-96 overflow-y-auto">
              {inbox.notifications.map((notification) => (
                <a
                  key={notification.id}
                  href={notification.href ?? "#"}
                  className="block border-b border-[var(--border)] px-3 py-3 last:border-b-0 hover:bg-[var(--accent)]"
                >
                  <span className="block text-sm font-semibold text-[var(--foreground)]">
                    {notification.title}
                  </span>
                  {notification.body ? (
                    <span className="mt-1 block text-xs leading-5 text-[var(--muted-foreground)]">
                      {notification.body}
                    </span>
                  ) : null}
                </a>
              ))}
            </div>
          ) : (
            <div className="grid min-h-40 place-items-center px-4 py-8 text-center">
              <div>
                <p className="text-sm font-bold text-[var(--foreground)]">
                  {stateTitle}
                </p>
                <p className="mt-2 text-sm leading-6 text-[var(--muted-foreground)]">
                  {stateDescription}
                </p>
                {inbox.reason ? (
                  <p className="mt-3 font-mono text-xs text-[var(--muted-foreground)]">
                    {inbox.reason}
                  </p>
                ) : null}
              </div>
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}
