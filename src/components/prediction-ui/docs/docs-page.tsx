import { BookOpen, FileText, HelpCircle, ShieldCheck, Wallet } from "lucide-react";
import { notFound } from "next/navigation";
import { SurfaceHeader } from "../surface-card";

const DOCS = {
  overview: {
    icon: BookOpen,
    en: {
      title: "Overview",
      description: "Chicken Dinner V2 is an adapter-first Polymarket interface.",
      body: [
        "Market discovery and detail pages read from V2 Polymarket adapters.",
        "Account data stays hidden until a wallet is connected and a verified adapter returns data.",
        "Live trading and live top-up remain disabled unless V2 server-side guards pass."
      ]
    },
    zh: {
      title: "概覽",
      description: "Chicken Dinner V2 是 adapter-first 的 Polymarket 介面。",
      body: [
        "市場探索和詳情頁讀取 V2 Polymarket adapter。",
        "連接錢包並由可驗證 adapter 返回資料前，不顯示帳戶資料。",
        "Live trading 和 live top-up 只有在 V2 伺服器端 guard 通過時才會啟用。"
      ]
    }
  },
  funding: {
    icon: Wallet,
    en: {
      title: "Funding",
      description: "Funding screens expose readiness; they do not bypass top-up safety.",
      body: [
        "Deposit wallet status, pUSD balances, and CLOB allowance are shown only from V2 checks.",
        "Exact approval is the only approval flow exposed by the V2 funding panel.",
        "The top-up kill switch and missing environment variables keep mutations disabled."
      ]
    },
    zh: {
      title: "資金",
      description: "資金頁只顯示準備狀態，不繞過 top-up 安全規則。",
      body: [
        "Deposit wallet 狀態、pUSD 餘額和 CLOB 授權只由 V2 檢查返回。",
        "V2 funding panel 只暴露精確授權流程。",
        "Top-up kill switch 或缺少環境變數時，所有 mutation 仍會停用。"
      ]
    }
  },
  safety: {
    icon: ShieldCheck,
    en: {
      title: "Safety",
      description: "V2 defaults to unavailable instead of guessing.",
      body: [
        "No fake markets, balances, positions, orders, comments, notifications, or leaderboard rows are generated.",
        "Trading submit paths stay fail-closed until wallet, funding, market, and server guards pass.",
        "Reference apps are UI and safety references only; their runtime code is not imported."
      ]
    },
    zh: {
      title: "安全",
      description: "V2 預設顯示 unavailable，而不是推測資料。",
      body: [
        "不產生假市場、餘額、持倉、訂單、留言、通知或排行榜。",
        "交易提交路徑在錢包、資金、市場和伺服器 guard 全部通過前保持 fail-closed。",
        "參考 app 只作 UI 和安全參考；不匯入其 runtime code。"
      ]
    }
  },
  help: {
    icon: HelpCircle,
    en: {
      title: "Help",
      description: "Use the visible unavailable states as the source of truth.",
      body: [
        "If a panel says unavailable, the required V2 adapter is not wired yet.",
        "If a panel says no real data returned, the adapter responded successfully with an empty list.",
        "If wallet connection is unavailable, configure the V2 wallet environment before testing account flows."
      ]
    },
    zh: {
      title: "協助",
      description: "請以頁面上的 unavailable 狀態作為真實狀態。",
      body: [
        "如果面板顯示 unavailable，代表所需 V2 adapter 尚未接入。",
        "如果面板顯示沒有真實資料，代表 adapter 成功返回空列表。",
        "如果錢包連接不可用，請先設定 V2 wallet 環境再測試帳戶流程。"
      ]
    }
  }
} as const;

type DocSlug = keyof typeof DOCS;

function isZh(locale: string) {
  return locale.toLowerCase().startsWith("zh");
}

function resolveDocSlug(slug: string[] | undefined): DocSlug {
  const [first, ...rest] = slug ?? [];
  if (rest.length > 0) {
    notFound();
  }
  if (!first) {
    return "overview";
  }
  if (first in DOCS) {
    return first as DocSlug;
  }
  notFound();
}

function docHref(locale: string, slug: DocSlug) {
  return slug === "overview" ? `/${locale}/docs` : `/${locale}/docs/${slug}`;
}

export function DocsPage({
  locale,
  slug
}: {
  locale: string;
  slug?: string[];
}) {
  const activeSlug = resolveDocSlug(slug);
  const active = DOCS[activeSlug];
  const content = active[isZh(locale) ? "zh" : "en"];
  const navEntries = Object.entries(DOCS) as Array<[DocSlug, (typeof DOCS)[DocSlug]]>;

  return (
    <main className="app-container-sm grid gap-6 py-8">
      <SurfaceHeader
        eyebrow={isZh(locale) ? "文件" : "Docs"}
        title={content.title}
        description={content.description}
        icon={active.icon}
      />

      <div className="grid gap-6 lg:grid-cols-[12rem_minmax(0,1fr)]">
        <nav
          aria-label={isZh(locale) ? "文件頁面" : "Documentation pages"}
          className="flex gap-2 overflow-x-auto lg:grid lg:self-start"
        >
          {navEntries.map(([entrySlug, entry]) => {
            const entryContent = entry[isZh(locale) ? "zh" : "en"];
            const Icon = entry.icon;
            const activeEntry = entrySlug === activeSlug;
            return (
              <a
                key={entrySlug}
                href={docHref(locale, entrySlug)}
                aria-current={activeEntry ? "page" : undefined}
                className={
                  activeEntry
                    ? "focus-ring inline-flex h-10 shrink-0 items-center gap-2 rounded-md bg-[var(--accent)] px-3 text-sm font-semibold text-[var(--foreground)]"
                    : "focus-ring inline-flex h-10 shrink-0 items-center gap-2 rounded-md px-3 text-sm font-semibold text-[var(--muted-foreground)] hover:bg-[var(--accent)] hover:text-[var(--foreground)]"
                }
              >
                <Icon className="size-4" aria-hidden="true" />
                {entryContent.title}
              </a>
            );
          })}
        </nav>

        <article className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-5">
          <ul className="grid gap-3">
            {content.body.map((item) => (
              <li
                key={item}
                className="flex gap-3 text-sm leading-6 text-[var(--foreground)]"
              >
                <FileText className="mt-1 size-4 shrink-0 text-[var(--primary)]" aria-hidden="true" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </article>
      </div>
    </main>
  );
}
