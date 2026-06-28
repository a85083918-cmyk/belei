"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { ReactNode } from "react";

import PaperCard from "./components/PaperCard";
import HeroCard from "./components/HeroCard";
import ScoreCard from "./components/ScoreCard";
import VerdictCard from "./components/VerdictCard";
import StickyNotes from "./components/StickyNotes";
import DeliveryCard from "./components/DeliveryCard";
import RiskCard from "./components/RiskCard";
import ReviewTimeline from "./components/ReviewTimeline";
import SourceCard from "./components/SourceCard";
import AlternativesCard from "./components/AlternativesCard";

import {
  getSection,
  getFirstLine,
  getRestLines,
  getConfidenceLevel,
  getRiskScore,
  getRiskLevel,
  getDeliveryRisk,
  getVerdictBadge,
} from "./utils";

export default function RestaurantPage({
  params,
}: {
  params: Promise<{ placeId: string }>;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [place, setPlace] = useState<any>(null);
  const [report, setReport] = useState("");
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [alternatives, setAlternatives] = useState<any[]>([]);

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
      const nextReport = reportData.report || "無法產生報告";
      setReport(nextReport);

      const keywordMatch = nextReport.match(/推薦搜尋關鍵字[:：]\s*([^\n]+)/);
const keyword =
  keywordMatch?.[1]?.trim() ||
  placeData.displayName?.text?.split(" ")[0] ||
  "餐廳";

      if (
        keyword &&
        placeData.location?.latitude &&
        placeData.location?.longitude
      ) {
        const alternativesRes = await fetch(
          `/api/alternatives?lat=${placeData.location.latitude}&lng=${
            placeData.location.longitude
          }&keyword=${encodeURIComponent(keyword)}&currentPlaceId=${placeId}`,
          { cache: "no-store" }
        );

        const alternativesData = await alternativesRes.json();
        console.log("alternatives keyword:", keyword);
console.log("alternatives data:", alternativesData);
setAlternatives(alternativesData.alternatives || []);
      }
    } catch (err) {
      console.error(err);
      setReport("產生報告失敗");
    } finally {
      setLoading(false);
    }
  }

  function renderContent(text: string): ReactNode {
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

  if (!place) {
    return (
      <main className="handwriting min-h-screen bg-[#fff8e8] p-10">
        <p className="font-black text-orange-500">店家資料載入中...</p>
      </main>
    );
  }

  const maxRisk = getSection(report, "🚨 最大風險");
  const expectationGap = getSection(report, "🚨 期待落差指數");
  const risks = getSection(report, "⚡ 雷點整理");
  const worthTrip = getSection(report, "🚗 值不值得專程前往");
  const verdict = getSection(report, "🍅 軍師最終判決");
  const oneTruth = getSection(report, "🎯 一句真話");
  const menuBudget = getSection(report, "🍜 菜單與預算推估");

  const isOpen = place.currentOpeningHours?.openNow;
  const reviews = place.reviews || [];
  const confidence = getConfidenceLevel(place.userRatingCount || 0);
  const riskScore = getRiskScore(place);
  const safetyScore = 100 - riskScore;
  const riskLevel = getRiskLevel(safetyScore);
  const deliveryRisk = getDeliveryRisk(riskScore);
  const verdictText = getVerdictBadge(getFirstLine(verdict));

  async function handleShareReport() {
    const shareText = `🍅 BeLei 避雷軍師報告
店家：${place.displayName?.text || "未知店家"}

🛡️ 安心分數：${safetyScore}/100
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
    <main className="handwriting min-h-screen overflow-x-hidden bg-[#fff8e8] px-4 py-6 text-stone-950">
      <div className="mx-auto w-full max-w-5xl">
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

        <HeroCard
          place={place}
          isOpen={!!isOpen}
          copied={copied}
          onShare={handleShareReport}
        />

        {loading && (
          <PaperCard className="mt-8 text-center">
            <div className="mx-auto h-14 w-14 animate-spin rounded-full border-4 border-orange-200 border-t-orange-500" />
            <h2 className="mt-6 text-3xl font-black text-orange-600">
              AI 軍師分析中...正在搜尋各大平台資料交叉比對
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

            <ScoreCard
              safetyScore={safetyScore}
              riskLevel={riskLevel}
              confidence={confidence}
            />

            <VerdictCard
              verdictText={verdictText}
              verdictReason={renderContent(getRestLines(verdict))}
            />

            <PaperCard>
              <StickyNotes
                oneTruth={oneTruth}
                worthTrip={worthTrip}
                menuBudget={menuBudget}
                address={place.formattedAddress}
                renderContent={renderContent}
              />
            </PaperCard>

            <div className="grid items-start gap-5 md:grid-cols-3">
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

              <DeliveryCard
                placeName={place.displayName?.text || ""}
                deliveryRisk={deliveryRisk}
              />

              <RiskCard risks={risks} renderContent={renderContent} />
            </div>

            {safetyScore < 60 && alternatives.length > 0 && (
  <AlternativesCard
    alternatives={alternatives}
    onOpenReport={(nextPlace) =>
      router.push(
        `/restaurant/${nextPlace.placeId}?source=nearby&distance=${
          nextPlace.distance ?? 0
        }`
      )
    }
  />
)}
            <AlternativesCard
  alternatives={alternatives}
  onOpenReport={(nextPlace) =>
    router.push(
      `/restaurant/${nextPlace.placeId}?source=nearby&distance=${
        nextPlace.distance ?? 0
      }`
    )
  }
/>

            <SourceCard />

            <ReviewTimeline reviews={reviews} />
          </section>
        )}
      </div>
    </main>
  );
}