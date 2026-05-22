"use client";

import { CircleDollarSign, HelpCircle, Search, ShieldCheck, Wallet, X } from "lucide-react";
import { useState } from "react";

function isZh(locale: string) {
  return locale.toLowerCase().startsWith("zh");
}

export function HowItWorksButton({ locale }: { locale: string }) {
  const [open, setOpen] = useState(false);
  const labels = isZh(locale)
    ? {
        button: "運作方式",
        close: "關閉",
        title: "Chicken Dinner 如何運作",
        description: "V2 只顯示可由 adapter 驗證的市場與帳戶資料。",
        steps: [
          {
            title: "探索真實市場",
            body: "市場列表來自 V2 Polymarket adapter；沒有返回資料時會顯示空狀態。",
            icon: Search
          },
          {
            title: "連接錢包",
            body: "錢包、網絡與 funding 狀態會在提交前逐項檢查。",
            icon: Wallet
          },
          {
            title: "保持 fail-closed",
            body: "Live trading 和 live top-up 只有在所有伺服器端 guard 通過時才會啟用。",
            icon: ShieldCheck
          }
        ]
      }
    : {
        button: "How it works",
        close: "Close",
        title: "How Chicken Dinner Works",
        description: "V2 only renders markets and account data that can be verified through adapters.",
        steps: [
          {
            title: "Explore real markets",
            body: "Market lists come from the V2 Polymarket adapter; missing data renders an empty state.",
            icon: Search
          },
          {
            title: "Connect a wallet",
            body: "Wallet, network, and funding readiness are checked before any submit path can unlock.",
            icon: Wallet
          },
          {
            title: "Stay fail-closed",
            body: "Live trading and live top-up remain disabled unless every server-side guard passes.",
            icon: ShieldCheck
          }
        ]
      };

  return (
    <>
      <button
        type="button"
        className="focus-ring inline-flex h-9 shrink-0 items-center justify-center gap-2 rounded-sm px-4 py-2 text-sm font-medium text-[var(--foreground)] transition-colors hover:bg-[var(--accent)]"
        onClick={() => setOpen(true)}
      >
        <HelpCircle className="size-4" aria-hidden="true" />
        {labels.button}
      </button>

      {open ? (
        <div className="fixed inset-0 z-50 grid place-items-end bg-black/25 px-3 pb-3 pt-16 sm:place-items-center sm:p-6">
          <section className="w-full max-w-lg rounded-lg border border-[var(--border)] bg-[var(--card)] p-4 shadow-[var(--panel-shadow)]">
            <div className="flex items-start justify-between gap-3">
              <div className="flex min-w-0 items-start gap-3">
                <div className="grid size-11 shrink-0 place-items-center rounded-full bg-[var(--muted)] text-[var(--primary)]">
                  <CircleDollarSign className="size-5" aria-hidden="true" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-[var(--foreground)]">
                    {labels.title}
                  </h2>
                  <p className="mt-1 text-sm leading-6 text-[var(--muted-foreground)]">
                    {labels.description}
                  </p>
                </div>
              </div>
              <button
                type="button"
                className="focus-ring inline-flex size-9 items-center justify-center rounded-sm text-[var(--muted-foreground)] hover:bg-[var(--accent)] hover:text-[var(--foreground)]"
                aria-label={labels.close}
                onClick={() => setOpen(false)}
              >
                <X className="size-4" aria-hidden="true" />
              </button>
            </div>

            <div className="mt-5 grid gap-3">
              {labels.steps.map((step) => {
                const Icon = step.icon;
                return (
                  <div
                    key={step.title}
                    className="grid grid-cols-[2.25rem_minmax(0,1fr)] gap-3 rounded-md border border-[var(--border)] bg-[var(--muted)] p-3"
                  >
                    <div className="grid size-9 place-items-center rounded-full bg-[var(--card)] text-[var(--primary)]">
                      <Icon className="size-4" aria-hidden="true" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-[var(--foreground)]">
                        {step.title}
                      </h3>
                      <p className="mt-1 text-sm leading-6 text-[var(--muted-foreground)]">
                        {step.body}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        </div>
      ) : null}
    </>
  );
}
