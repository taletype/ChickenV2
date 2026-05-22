import {
  BadgePercent,
  Bell,
  Coins,
  Fingerprint,
  Package,
  Settings,
  UserRound
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { SurfaceHeader, UnavailableState } from "../surface-card";

export const SETTINGS_SECTIONS = [
  "profile",
  "account",
  "notifications",
  "trading",
  "affiliate",
  "sdks"
] as const;

export type SettingsSection = (typeof SETTINGS_SECTIONS)[number];

type SettingsConfig = {
  id: SettingsSection;
  icon: LucideIcon;
  label: string;
  title: string;
  description: string;
  unavailableTitle: string;
  unavailableDescription: string;
};

function isZh(locale: string) {
  return locale.toLowerCase().startsWith("zh");
}

function settingsConfigs(locale: string): SettingsConfig[] {
  if (isZh(locale)) {
    return [
      {
        id: "profile",
        icon: UserRound,
        label: "個人檔案",
        title: "個人檔案設定",
        description: "公開名稱、頭像及偏好需要 V2 伺服器擁有的設定 adapter。",
        unavailableTitle: "個人檔案設定暫不可用",
        unavailableDescription: "V2 尚未接入設定儲存，因此不顯示或儲存任何假個人資料。"
      },
      {
        id: "account",
        icon: Fingerprint,
        label: "帳戶",
        title: "帳戶",
        description: "帳戶安全狀態會在 V2 有明確登入與設定 adapter 後顯示。",
        unavailableTitle: "帳戶設定暫不可用",
        unavailableDescription: "未接入 V2 帳戶 adapter 前，不顯示 2FA、刪除帳戶或安全狀態。"
      },
      {
        id: "notifications",
        icon: Bell,
        label: "通知",
        title: "通知",
        description: "通知偏好需要伺服器擁有的通知 adapter。",
        unavailableTitle: "通知設定暫不可用",
        unavailableDescription: "目前不顯示假通知偏好、未讀數或事件提醒。"
      },
      {
        id: "trading",
        icon: Coins,
        label: "交易",
        title: "交易設定",
        description: "交易偏好不得繞過現有 V2 live-submit guard。",
        unavailableTitle: "交易設定暫不可用",
        unavailableDescription: "Live trading 仍然 fail-closed；沒有可提交的交易偏好。"
      },
      {
        id: "affiliate",
        icon: BadgePercent,
        label: "推薦",
        title: "推薦計劃",
        description: "推薦收益需要 V2 自有 accounting adapter。",
        unavailableTitle: "推薦設定暫不可用",
        unavailableDescription: "不移植參考應用的推薦 runtime，也不顯示假收益或推薦人數。"
      },
      {
        id: "sdks",
        icon: Package,
        label: "SDK",
        title: "SDK",
        description: "SDK 下載需要 V2 明確支援的 API 產品面。",
        unavailableTitle: "SDK 下載暫不可用",
        unavailableDescription: "不移植參考應用的 SDK generator 或交易機械人下載流程。"
      }
    ];
  }

  return [
    {
      id: "profile",
      icon: UserRound,
      label: "Profile",
      title: "Profile settings",
      description: "Public names, avatars, and preferences require a server-owned V2 settings adapter.",
      unavailableTitle: "Profile settings unavailable",
      unavailableDescription: "No V2 settings store is wired yet, so fake profile data is not shown or saved."
    },
    {
      id: "account",
      icon: Fingerprint,
      label: "Account",
      title: "Account",
      description: "Account security appears after V2 has an explicit login and settings adapter.",
      unavailableTitle: "Account settings unavailable",
      unavailableDescription: "2FA, account deletion, and security state stay hidden until V2 owns those flows."
    },
    {
      id: "notifications",
      icon: Bell,
      label: "Notifications",
      title: "Notifications",
      description: "Notification preferences require a server-owned notification adapter.",
      unavailableTitle: "Notification settings unavailable",
      unavailableDescription: "Fake preferences, unread counts, and event alerts are not shown."
    },
    {
      id: "trading",
      icon: Coins,
      label: "Trading",
      title: "Trading settings",
      description: "Trading preferences cannot bypass the existing V2 live-submit guards.",
      unavailableTitle: "Trading settings unavailable",
      unavailableDescription: "Live trading remains fail-closed; there are no submit-enabled trading preferences."
    },
    {
      id: "affiliate",
      icon: BadgePercent,
      label: "Affiliate",
      title: "Affiliate program",
      description: "Referral earnings require a V2-owned accounting adapter.",
      unavailableTitle: "Affiliate settings unavailable",
      unavailableDescription: "Reference-app affiliate runtime is not ported, and fake earnings or referral counts are not shown."
    },
    {
      id: "sdks",
      icon: Package,
      label: "SDKs",
      title: "SDKs",
      description: "SDK downloads require an API product surface explicitly supported by V2.",
      unavailableTitle: "SDK downloads unavailable",
      unavailableDescription: "Reference-app SDK generator and trading bot download flows are not ported."
    }
  ];
}

function hrefForSection(locale: string, section: SettingsSection) {
  return section === "profile" ? `/${locale}/settings` : `/${locale}/settings/${section}`;
}

export function SettingsPage({
  locale,
  section
}: {
  locale: string;
  section: SettingsSection;
}) {
  const configs = settingsConfigs(locale);
  const activeConfig = configs.find((config) => config.id === section) ?? configs[0];

  return (
    <main className="app-container-sm grid gap-6 py-8">
      <SurfaceHeader
        eyebrow={isZh(locale) ? "設定" : "Settings"}
        title={activeConfig.title}
        description={activeConfig.description}
        icon={Settings}
      />

      <div className="grid gap-6 lg:grid-cols-[13rem_minmax(0,1fr)]">
        <nav
          aria-label={isZh(locale) ? "設定分頁" : "Settings sections"}
          className="flex gap-2 overflow-x-auto lg:grid lg:self-start"
        >
          {configs.map((config) => {
            const Icon = config.icon;
            const active = config.id === activeConfig.id;
            return (
              <a
                key={config.id}
                href={hrefForSection(locale, config.id)}
                aria-current={active ? "page" : undefined}
                className={
                  active
                    ? "focus-ring inline-flex h-10 shrink-0 items-center gap-2 rounded-md bg-[var(--accent)] px-3 text-sm font-semibold text-[var(--foreground)]"
                    : "focus-ring inline-flex h-10 shrink-0 items-center gap-2 rounded-md px-3 text-sm font-semibold text-[var(--muted-foreground)] hover:bg-[var(--accent)] hover:text-[var(--foreground)]"
                }
              >
                <Icon className="size-4" aria-hidden="true" />
                <span>{config.label}</span>
              </a>
            );
          })}
        </nav>

        <UnavailableState
          title={activeConfig.unavailableTitle}
          description={activeConfig.unavailableDescription}
          reason={`${activeConfig.id}_settings_adapter_not_configured`}
        />
      </div>
    </main>
  );
}
