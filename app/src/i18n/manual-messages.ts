import type { SupportedLocale } from "./locales";

type Messages = Record<string, unknown>;

export const manualMessages: Record<SupportedLocale, Messages> = {
  en: {
    nav: {
      markets: "Markets",
      portfolio: "Portfolio",
      connect: "Connect wallet"
    },
    common: {
      unavailable: "Unavailable",
      stale: "Stale",
      refresh: "Refresh",
      noData: "No live data available"
    },
    trade: {
      buy: "Buy",
      sell: "Sell",
      limit: "Limit",
      market: "Market",
      disabled: "Trading is disabled until live safety gates are ready.",
      submitBlocked: "Submit blocked"
    },
    funding: {
      addFunds: "Add funds",
      withdraw: "Withdraw",
      unsupportedWithdrawal: "Unsupported withdrawal path",
      official: "Open Polymarket portfolio"
    }
  },
  zh: {
    nav: {
      markets: "市場",
      portfolio: "投資組合",
      connect: "連接錢包"
    },
    common: {
      unavailable: "暫時無法使用",
      stale: "資料過期",
      refresh: "重新整理",
      noData: "未有即時資料"
    },
    trade: {
      buy: "買入",
      sell: "賣出",
      limit: "限價",
      market: "市價",
      disabled: "交易要等待安全閘門完成設定後才會開放。",
      submitBlocked: "提交已封鎖"
    },
    funding: {
      addFunds: "加入資金",
      withdraw: "提取",
      unsupportedWithdrawal: "暫不支援此提款路徑",
      official: "開啟 Polymarket 投資組合"
    }
  }
};

export function mergeMessages(base: Messages, manual: Messages): Messages {
  const merged: Messages = { ...base };

  for (const [key, value] of Object.entries(manual)) {
    if (
      value &&
      typeof value === "object" &&
      !Array.isArray(value) &&
      base[key] &&
      typeof base[key] === "object" &&
      !Array.isArray(base[key])
    ) {
      merged[key] = mergeMessages(base[key] as Messages, value as Messages);
    } else {
      merged[key] = value;
    }
  }

  return merged;
}
