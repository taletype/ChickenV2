import { Scale } from "lucide-react";
import { SurfaceHeader, SurfaceCard } from "@/components/prediction-ui/surface-card";

function isZh(locale: string) {
  return locale.toLowerCase().startsWith("zh");
}

export default async function TermsRoute({
  params
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const labels = isZh(locale)
    ? {
        eyebrow: "條款",
        title: "使用條款",
        description: "此 V2 條款頁是保守佔位內容；正式法律文本應由營運方審批後替換。",
        sections: [
          {
            title: "非託管",
            body: "Chicken Dinner 不保管你的資產，不控制你的錢包，也不能逆轉鏈上交易。"
          },
          {
            title: "資料真實性",
            body: "市場、價格、帳戶和交易資料只應由 V2 adapter 或使用者錢包返回。"
          },
          {
            title: "風險",
            body: "預測市場、區塊鏈交易和第三方服務可能失敗、延遲或造成損失。"
          }
        ]
      }
    : {
        eyebrow: "Terms",
        title: "Terms of Use",
        description: "This V2 terms page is a conservative placeholder; final legal text should be approved by the operator.",
        sections: [
          {
            title: "Non-custodial",
            body: "Chicken Dinner does not custody your assets, control your wallet, or reverse on-chain transactions."
          },
          {
            title: "Data truth",
            body: "Markets, prices, account data, and trading data should appear only when returned by V2 adapters or your wallet."
          },
          {
            title: "Risk",
            body: "Prediction markets, blockchain transactions, and third-party services may fail, delay, or cause loss."
          }
        ]
      };

  return (
    <main className="app-container-sm grid gap-6 py-8">
      <SurfaceHeader
        eyebrow={labels.eyebrow}
        title={labels.title}
        description={labels.description}
        icon={Scale}
      />
      <div className="grid gap-4">
        {labels.sections.map((section) => (
          <SurfaceCard
            key={section.title}
            title={section.title}
            description={section.body}
          />
        ))}
      </div>
    </main>
  );
}
