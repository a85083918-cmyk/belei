"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

export default function RestaurantPage({
  params,
}: {
  params: Promise<{ placeId: string }>;
}) {
  const [place, setPlace] = useState<any>(null);
  const [report, setReport] = useState("");
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  const searchParams = useSearchParams();
  const source = searchParams.get("source");
  const distance = searchParams.get("distance");
  const isNearby = source === "nearby";

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    const { placeId } = await params;

    try {
      const placeRes = await fetch(`/api/place?placeId=${placeId}`);
      const placeData = await placeRes.json();

      setPlace(placeData);

      const reportRes = await fetch("/api/report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: placeData.displayName?.text || placeData.name || "未知店家",
          address: placeData.formattedAddress || "地址資料不足",
          rating: placeData.rating ?? null,
          userRatingCount: placeData.userRatingCount ?? 0,
          reviews: placeData.reviews || [],
          openNow: placeData.currentOpeningHours?.openNow ?? null,
          types: placeData.types || [],
          googleMapsUri: placeData.googleMapsUri || "",
          fallbackContext: `
這是一筆 Google 地圖 POI 或 Nearby 搜尋店家資料。
即使公開評論文字不足，也請根據店名、地址、Google 星等、評論數、營業狀態、店家類型，產生「基礎避雷報告」。
不要整份回覆資料不足；若缺少評論，請明確標示「評論文字不足，以下為基礎風險推估」。
`,
        }),
      });

      const reportData = await reportRes.json();
      setReport(reportData.report || "無法產生報告");
    } catch (err) {
      console.error(err);
      setReport("產生報告失敗");
    }

    setLoading(false);
  }

  function getSection(title: string) {
    const regex = new RegExp(`## ${title}([\\s\\S]*?)(?=\\n## |$)`);
    const match = report.match(regex);
    return match ? match[1].trim() : "";
  }

  function renderContent(text: string) {
    if (!text) {
      return <p className="text-stone-500">資料不足，暫無明確內容。</p>;
    }

    return text.split("\n").map((line, index) => {
      const clean = line.trim();
      if (!clean) return null;

      if (clean.startsWith("-")) {
        return (
          <li key={index} className="mb-2 leading-8 text-stone-800">
            {clean.replace("-", "").trim()}
          </li>
        );
      }

      return (
        <p key={index} className="mb-3 leading-8 text-stone-800">
          {clean}
        </p>
      );
    });
  }

  function renderMenuBudget(text: string) {
    if (!text) {
      return <p className="text-stone-500">資料不足，暫無明確內容。</p>;
    }

    return (
      <div className="space-y-4">
        {text
          .split("\n")
          .filter(Boolean)
          .map((line, i) => {
            const item = line.trim();

            if (
              item.includes("NT$") ||
              item.includes("¥") ||
              item.includes("₩") ||
              item.includes("฿") ||
              item.includes("HK$") ||
              item.includes("S$") ||
              item.includes("台幣換算")
            ) {
              return (
                <div
                  key={i}
                  className="rounded-2xl border border-stone-200 bg-white/70 px-4 py-3 font-black text-stone-900"
                >
                  {item}
                </div>
              );
            }

            if (
              item.includes("中價位") ||
              item.includes("平價") ||
              item.includes("偏高") ||
              item.includes("高單價") ||
              item.includes("奢華")
            ) {
              return (
                <div
                  key={i}
                  className="inline-flex rounded-full bg-orange-100 px-4 py-2 font-black text-orange-700"
                >
                  💸 {item}
                </div>
              );
            }

            if (item.includes("推薦品項")) {
              return (
                <div key={i} className="mt-2 font-black text-stone-900">
                  ⭐ 推薦品項
                </div>
              );
            }

            if (item.startsWith("-")) {
              return (
                <div
                  key={i}
                  className="rounded-xl bg-stone-50 px-4 py-2 text-stone-700"
                >
                  {item.replace("-", "").trim()}
                </div>
              );
            }

            if (item.includes("價格註記") || item.includes("AI")) {
              return null;
            }

            return (
              <p key={i} className="leading-7 text-stone-700">
                {item}
              </p>
            );
          })}

        <div className="border-t border-stone-200 pt-4 text-xs leading-6 text-stone-500">
          🤖 價格、品項與匯率為 AI 根據公開資訊推估，實際仍以店家現場菜單與即時匯率為準。
        </div>
      </div>
    );
  }

  function getFirstLine(text: string) {
    return text.split("\n").find((line) => line.trim()) || "";
  }

  function getRestLines(text: string) {
    return text
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean)
      .slice(1)
      .join("\n");
  }

  function cleanVerdict(text: string) {
    return text.replace("【", "").replace("】", "").trim();
  }

  function getConfidenceLevel(count: number) {
    if (count >= 1000) return { stars: "★★★★☆", title: "高信心" };
    if (count >= 300) return { stars: "★★★☆☆", title: "中高信心" };
    if (count >= 100) return { stars: "★★★☆☆", title: "中等信心" };
    if (count >= 30) return { stars: "★★☆☆☆", title: "資料有限" };
    return { stars: "★☆☆☆☆", title: "資料不足" };
  }

  function getRiskScore() {
    let score = 50;

    const rating = place?.rating || 0;
    const count = place?.userRatingCount || 0;
    const reviews = place?.reviews || [];

    if (rating >= 4.7) score -= 10;
    else if (rating >= 4.5) score -= 5;
    else if (rating < 3.5) score += 20;
    else if (rating < 4.0) score += 10;

    if (count >= 1000) score -= 8;
    else if (count >= 300) score -= 5;
    else if (count < 30) score += 12;
    else if (count < 100) score += 6;

    const lowStars = reviews.filter((r: any) => (r.rating || 5) <= 3).length;
    const ratio = reviews.length === 0 ? 0 : lowStars / reviews.length;

    if (ratio > 0.25) score += 20;
    else if (ratio > 0.15) score += 10;

    return Math.max(0, Math.min(score, 100));
  }

  function getRiskLevel(score: number) {
    if (score >= 75) return "高風險";
    if (score >= 50) return "中高風險";
    if (score >= 35) return "中度風險";
    return "低風險";
  }

  function getDeliveryRisk(score: number) {
    if (score <= 20) return { emoji: "💥", title: "低風險" };
    if (score <= 40) return { emoji: "💥💥", title: "中低風險" };
    if (score <= 60) return { emoji: "💥💥💥", title: "中風險" };
    if (score <= 80) return { emoji: "💥💥💥💥", title: "高風險" };
    return { emoji: "💥💥💥💥💥", title: "極高風險" };
  }

  function getVerdictBadge(text: string) {
    const cleanText = cleanVerdict(text);

    if (cleanText.includes("值得")) return "值得吃";
    if (cleanText.includes("順路")) return "順路可吃";
    if (cleanText.includes("不建議")) return "不建議專程";
    if (cleanText.includes("謹慎")) return "謹慎考慮";

    return cleanText || "需要觀望";
  }

  if (!place) {
    return (
      <main className="handwriting min-h-screen bg-[#fff8e8] p-10">
        <p className="font-black text-orange-500">店家資料載入中...</p>
      </main>
    );
  }

  const maxRisk = getSection("🚨 最大風險");
  const expectationGap = getSection("🚨 期待落差指數");
  const risks = getSection("⚡ 雷點整理");
  const worthTrip = getSection("🚗 值不值得專程前往");
  const verdict = getSection("🍅 軍師最終判決");
  const oneTruth = getSection("🎯 一句真話");
  const menuBudget = getSection("🍜 菜單與預算推估");

  const isOpen = place.currentOpeningHours?.openNow;
  const reviews = place.reviews || [];
  const confidence = getConfidenceLevel(place.userRatingCount || 0);
  const riskScore = getRiskScore();
  const riskLevel = getRiskLevel(riskScore);
  const deliveryRisk = getDeliveryRisk(riskScore);
  const verdictText = getVerdictBadge(getFirstLine(verdict));

  async function handleShareReport() {
    const shareText = `🍅 BeLei 避雷軍師報告
店家：${place.displayName?.text || "未知店家"}

🌶️ 避雷指數：${riskScore}/100
🙂 軍師判決：${verdictText}
💥 外送風險：${deliveryRisk.emoji} ${deliveryRisk.title}（AI推估）

來看完整避雷報告：
${window.location.href}`;

    try {
      await navigator.clipboard.writeText(shareText);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch (error) {
      console.error("分享複製失敗", error);
    }
  }

  return (
    <main className="handwriting min-h-screen bg-[#fff8e8] px-4 py-6 text-stone-950">
      <div className="mx-auto max-w-5xl">
        <Link href="/" className="font-black text-orange-600">
          ← 回首頁
        </Link>

        {isNearby && (
          <div className="mb-5 rounded-[26px] border border-green-200 bg-green-50 p-5 shadow-sm">
            <div className="text-lg font-black text-green-700">
              📍 來自附近避雷
            </div>

            <p className="mt-2 font-bold leading-7 text-stone-700">
              你目前距離這間店約{" "}
              <span className="text-green-700">{distance}m</span>
              ，BeLei 已根據附近搜尋為你產生避雷報告。
            </p>
          </div>
        )}

        <section className="relative mt-5 overflow-visible rounded-[30px] border-2 border-stone-800 bg-[#fffdf5] p-8 shadow-[8px_8px_0_#ead8b5]">
          <Tape position="left" />

          <div className="grid items-center gap-8 md:grid-cols-[1fr_340px]">
            <div>
              <p className="text-sm font-black tracking-widest text-orange-500">
                BeLei 避雷軍師報告
              </p>

              <h1 className="mt-3 text-4xl font-black leading-tight md:text-5xl">
                {place.displayName?.text}
              </h1>

              <p className="mt-4 leading-7 text-stone-600">
                {place.formattedAddress}
              </p>

              <div className="mt-5 flex flex-wrap gap-3">
                <Badge>Google {place.rating ?? "-"}★</Badge>
                <Badge>{place.userRatingCount ?? 0} 則評論</Badge>
                <Badge>{isOpen ? "營業中" : "目前未營業"}</Badge>
              </div>

              <button
                onClick={handleShareReport}
                className="mt-5 rounded-2xl border-2 border-orange-300 bg-orange-50 px-5 py-3 font-black text-orange-700 transition hover:-translate-y-0.5 hover:bg-orange-100"
              >
                {copied ? "✅ 已複製報告" : "📤 分享報告"}
              </button>
            </div>

            <div className="hidden items-center justify-center md:flex">
              <div className="relative h-[220px] w-[300px]">
                <Image
                  src="/illustrations/restaurant-shop.png"
                  alt="餐廳插圖"
                  width={300}
                  height={220}
                  priority
                  className="relative z-10 select-none drop-shadow-[0_20px_10px_rgba(0,0,0,0.30)]"
                />
              </div>
            </div>
          </div>
        </section>

        {loading && (
          <PaperCard className="mt-8 text-center">
            <div className="mx-auto h-14 w-14 animate-spin rounded-full border-4 border-orange-200 border-t-orange-500" />
            <h2 className="mt-6 text-3xl font-black text-orange-600">
              AI 軍師分析中...
            </h2>
            <p className="mt-4 font-bold text-stone-600">
              正在整理公開評論、近期雷點與期待落差。
            </p>
          </PaperCard>
        )}

        {!loading && (
          <section className="mt-8 space-y-7">
            {!isOpen && (
              <PaperCard color="red">
                <h2 className="text-2xl font-black text-red-600">
                  ⚠️ 目前未營業，請勿白跑一趟！
                </h2>
                <p className="mt-3 leading-8 text-red-700">
                  Google Places 顯示目前未營業，建議出發前再確認店家公告或營業時間。
                </p>
              </PaperCard>
            )}

            <PaperCard medal>
              <div className="grid gap-8 md:grid-cols-3">
                <div className="md:border-r-2 md:border-stone-200 md:pr-8">
                  <h2 className="text-2xl font-black">BeLei 避雷指數</h2>
                  <div className="mt-5 flex items-end gap-2">
                    <span className="number-font text-7xl font-black text-orange-500">
                      {riskScore}
                    </span>
                    <span className="mb-3 text-2xl font-black">/100</span>
                  </div>

                  <div className="mt-3 inline-flex rounded-full bg-orange-100 px-4 py-2 font-black text-orange-700">
                    🌶️ {riskLevel}
                  </div>

                  <div className="mt-5 h-4 overflow-hidden rounded-full bg-stone-200">
                    <div
                      className="h-full rounded-full bg-orange-400"
                      style={{ width: `${riskScore}%` }}
                    />
                  </div>
                </div>

                <div className="md:border-r-2 md:border-stone-200 md:px-8">
                  <h2 className="text-2xl font-black">本次分析信心</h2>
                  <div className="mt-6 text-4xl text-yellow-500">
                    {confidence.stars}
                  </div>
                  <div className="mt-5 inline-flex rounded-full border-2 border-blue-300 bg-blue-50 px-5 py-2 text-xl font-black text-blue-600">
                    {confidence.title}
                  </div>
                </div>

                <div className="md:pl-8">
                  <h2 className="text-2xl font-black">本次主要風險來源</h2>
                  <ul className="mt-5 space-y-3 leading-8">
                    <li>• 近期負評與公開評論訊號</li>
                    <li>• 評分與評論數的落差</li>
                    <li>• 高期待可能產生體驗落差</li>
                    <li>• 營業與尖峰時段穩定度</li>
                  </ul>
                </div>
              </div>
            </PaperCard>

            <PaperCard>
              <div className="text-center">
                <h2 className="text-3xl font-black">🍅 BeLei 終極結論</h2>

                <div className="mx-auto mt-5 inline-flex rounded-full border-2 border-yellow-600 bg-yellow-300 px-10 py-4 text-3xl font-black shadow-[4px_4px_0_#d6a63a]">
                  🙂 {verdictText}
                </div>

                <div className="mx-auto mt-7 max-w-2xl leading-8">
                  {renderContent(getRestLines(verdict))}
                </div>
              </div>

              <div className="mt-8 grid gap-4 md:grid-cols-3">
                <StickyNote color="pink" title="💬 真心話">
                  {renderContent(oneTruth)}
                </StickyNote>

                <StickyNote color="green" title="😊 適合">
                  {renderContent(worthTrip)}
                </StickyNote>

                <StickyNote color="yellow" title="🍜 菜單與預算推估">
                  {renderMenuBudget(menuBudget)}
                </StickyNote>
              </div>
            </PaperCard>

            <div className="grid gap-5 md:grid-cols-3">
              <PaperCard small>
                <h3 className="text-2xl font-black">⭐ 期待落差指數</h3>

                <div className="mt-4 inline-flex rounded-full bg-yellow-100 px-4 py-2 text-xl font-black text-orange-700">
                  {getFirstLine(expectationGap) || "資料不足"}
                </div>

                <div className="mt-4">
                  {renderContent(getRestLines(expectationGap))}
                </div>

                <div className="mt-8 border-t border-stone-200 pt-5">
                  <h4 className="text-xl font-black">🚨 最大風險</h4>
                  <div className="mt-3">{renderContent(maxRisk)}</div>
                </div>
              </PaperCard>

              <PaperCard small color="green">
                <h3 className="text-2xl font-black text-green-700">
                  🛵 外送體驗推估
                </h3>

                <div className="mt-4 inline-flex rounded-full bg-orange-100 px-4 py-2 font-black text-orange-700">
                  {deliveryRisk.emoji} {deliveryRisk.title}（AI推估）
                </div>

                <div className="mt-5 space-y-3 text-stone-700">
                  <p>• 熱食溫度可能下降</p>
                  <p>• 尖峰時段等待時間較久</p>
                  <p>• 部分餐點依賴現場口感完整度</p>
                </div>

                <div className="mt-5 rounded-2xl border border-orange-200 bg-orange-50 p-4 text-sm leading-7 text-stone-600">
                  🤖 本結果根據 Google 公開評論、餐點特性、公開社群討論與常見外送情境進行 AI 推估，
                  並非 Uber Eats 或 Foodpanda 即時訂單資料。
                </div>

                <div className="mt-6 border-t border-stone-200 pt-5">
                  <h4 className="font-black text-stone-800">🛵 立即訂餐</h4>

                  <div className="mt-4 flex flex-wrap gap-3">
                    <button
                      onClick={() =>
                        window.open(
                          `https://www.ubereats.com/search?q=${encodeURIComponent(
                            place.displayName?.text || ""
                          )}`,
                          "_blank"
                        )
                      }
                      className="rounded-xl bg-black px-4 py-2 font-black text-white transition hover:scale-105"
                    >
                      Uber Eats
                    </button>

                    <button
                      onClick={() =>
                        window.open(
                          `https://www.foodpanda.com.tw/search/${encodeURIComponent(
                            place.displayName?.text || ""
                          )}`,
                          "_blank"
                        )
                      }
                      className="rounded-xl bg-[#ff2b85] px-4 py-2 font-black text-white transition hover:scale-105"
                    >
                      foodpanda
                    </button>
                  </div>
                </div>
              </PaperCard>

              <PaperCard small color="orange">
                <h3 className="text-2xl font-black text-orange-700">
                  ⚡ 雷點整理
                </h3>

                <div className="mt-4">{renderContent(risks)}</div>
              </PaperCard>
            </div>

            <div className="rounded-[22px] border border-stone-200 bg-white/60 px-5 py-4 text-xs leading-6 text-stone-400">
              ℹ️ 資料來源：Google Places、公開評論資料、BeLei 分析模型整理。
              Google Places 僅提供部分公開評論，不等於完整一年評論資料；BeLei
              會優先參考目前可取得的近期評論與品質穩定度。外送平台資料後續將接入公開頁面資訊。
            </div>

            <PaperCard>
              <h3 className="text-2xl font-black">
                🧾 BeLei 判斷依據（近一年優先）
              </h3>

              <p className="mt-4 leading-8 text-stone-700">
                Google Places 僅提供部分公開評論，不等於完整一年評論資料。
                BeLei 會優先參考目前可取得的近期評論與品質穩定度。
              </p>

              <div className="mt-6 space-y-4">
                {reviews.length ? (
                  reviews.map((review: any, index: number) => (
                    <div
                      key={index}
                      className="rounded-[20px] border-2 border-stone-100 bg-[#fffdf7] p-5"
                    >
                      <p className="font-black">
                        {review.rating ?? "-"}★・
                        {review.relativePublishTimeDescription ?? "時間未提供"}
                      </p>
                      <p className="mt-3 leading-8 text-stone-700">
                        {review.text?.text || "無文字評論"}
                      </p>
                    </div>
                  ))
                ) : (
                  <p>目前沒有可顯示的近期公開評論。</p>
                )}
              </div>
            </PaperCard>
          </section>
        )}
      </div>
    </main>
  );
}

function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-full border-2 border-orange-200 bg-orange-50 px-4 py-2 text-sm font-black text-orange-700">
      {children}
    </span>
  );
}

function Tape({ position }: { position: "left" | "right" }) {
  return (
    <div
      className={`pointer-events-none absolute -top-4 z-30 h-8 w-24 rounded-sm opacity-90 shadow-md ${
        position === "left"
          ? "left-8 rotate-[-10deg] bg-[#ffd84f]"
          : "right-8 rotate-[10deg] bg-[#ffcfa3]"
      }`}
    />
  );
}

function PaperCard({
  children,
  small = false,
  color = "white",
  medal = false,
  className = "",
}: {
  children: React.ReactNode;
  small?: boolean;
  color?: "white" | "red" | "green" | "yellow" | "orange";
  medal?: boolean;
  className?: string;
}) {
  const bg =
    color === "red"
      ? "bg-red-50"
      : color === "green"
      ? "bg-green-50"
      : color === "yellow"
      ? "bg-yellow-50"
      : color === "orange"
      ? "bg-orange-50"
      : "bg-[#fffdf5]";

  return (
    <div
      className={`relative overflow-visible rounded-[30px] border-2 border-stone-800 ${bg} ${
        small ? "p-5" : "p-6 md:p-8"
      } shadow-[8px_8px_0_#ead8b5] ${className}`}
    >
      <Tape position="left" />
      <Tape position="right" />

      {medal && (
        <div className="absolute -right-4 -top-5 z-40 text-6xl drop-shadow-md">
          ⭐
        </div>
      )}

      <div className="pointer-events-none absolute inset-0 rounded-[28px] bg-[radial-gradient(#eadfca_0.9px,transparent_0.9px)] bg-[length:18px_18px] opacity-35" />

      <div className="relative z-20">{children}</div>
    </div>
  );
}

function StickyNote({
  title,
  children,
  color,
}: {
  title: string;
  children: React.ReactNode;
  color: "pink" | "green" | "yellow";
}) {
  const style =
    color === "pink"
      ? "border-pink-200 bg-pink-50 text-red-600"
      : color === "green"
      ? "border-green-200 bg-green-50 text-green-700"
      : "border-yellow-200 bg-yellow-50 text-orange-700";

  return (
    <div className={`rounded-[22px] border-2 p-5 ${style}`}>
      <h3 className="text-xl font-black">{title}</h3>
      <div className="mt-4 text-stone-800">{children}</div>
    </div>
  );
}