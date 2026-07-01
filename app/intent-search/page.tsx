"use client";

import Link from "next/link";
import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

type IntentInfo = {
  keyword: string;
  city: string;
  reason: string;
};

type IntentResult = {
  placeId: string;
  name: string;
  address: string;
  rating: number | null;
  userRatingCount: number;
  openNow: boolean | null;
  distance: number | null;
  safetyScore: number;
};

function formatDistance(distance: number | null) {
  if (distance === null) return "距離未知";
  if (distance >= 1000) return `${(distance / 1000).toFixed(1)}km`;
  return `${distance}m`;
}

function getSafetyStyle(score: number) {
  if (score >= 80) return "bg-green-100 text-green-700";
  if (score >= 70) return "bg-lime-100 text-lime-700";
  return "bg-yellow-100 text-orange-700";
}

export default function IntentSearchPage() {
  return (
    <Suspense
      fallback={
        <main className="handwriting min-h-screen bg-[#fff8e8] px-4 py-6 text-stone-950">
          <div className="mx-auto max-w-5xl">
            <p className="font-black text-orange-500">載入中...</p>
          </div>
        </main>
      }
    >
      <IntentSearchContent />
    </Suspense>
  );
}

function IntentSearchContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const q = searchParams.get("q") || "";
  const cityParam = searchParams.get("city") || "高雄";
  const lat = searchParams.get("lat") || "";
  const lng = searchParams.get("lng") || "";

  const [loading, setLoading] = useState(true);
  const [intent, setIntent] = useState<IntentInfo | null>(null);
  const [results, setResults] = useState<IntentResult[]>([]);

  useEffect(() => {
    loadResults();
  }, [q, cityParam, lat, lng]);

  async function loadResults() {
    try {
      setLoading(true);

      const params = new URLSearchParams();
      params.set("q", q);
      params.set("city", cityParam);

      if (lat) params.set("lat", lat);
      if (lng) params.set("lng", lng);

      const res = await fetch(`/api/intent-search?${params.toString()}`, {
        cache: "no-store",
      });

      const data = await res.json();

      setIntent(data.intent || null);
      setResults(data.results || []);
    } catch (error) {
      console.error(error);
      setIntent(null);
      setResults([]);
    } finally {
      setLoading(false);
    }
  }

  const displayCity = intent?.city || cityParam;
  const displayKeyword = intent?.keyword || "餐廳";

  return (
    <main className="handwriting min-h-screen bg-[#fff8e8] px-4 py-6 text-stone-950">
      <div className="mx-auto max-w-5xl">
        <Link href="/" className="font-black text-orange-600">
          ← 回首頁
        </Link>

        <section className="mt-6 rounded-[32px] border-2 border-orange-100 bg-white/80 p-6 shadow-sm">
          <p className="text-sm font-black text-orange-500">AI 需求搜尋</p>

          <h1 className="mt-3 text-4xl font-black leading-tight">
            BeLei 幫你挑：
            <span className="text-orange-600">
              {displayCity} {displayKeyword}
            </span>
          </h1>

          <p className="mt-4 leading-8 text-stone-700">
            你輸入的是「{q || "未輸入"}」。BeLei 會優先列出安心分數高、評價樣本較足夠的店家。
          </p>
        </section>

        <section className="mt-6 rounded-[32px] border-2 border-orange-100 bg-[#fffdf5] p-6 shadow-sm">
          <p className="text-sm font-black text-orange-500">🧠 AI 軍師建議</p>

          <h2 className="mt-3 text-2xl font-black">
            我會先用「{displayKeyword}」幫你找，而不是只丟一般餐廳。
          </h2>

          <p className="mt-4 leading-8 text-stone-700">
            {intent?.reason ||
              "BeLei 會根據你的需求，優先比對評價樣本、安心分數、距離與營業狀態，幫你降低踩雷機率。"}
          </p>

          <div className="mt-5 flex flex-wrap gap-2 text-sm font-black">
            <span className="rounded-full bg-orange-100 px-3 py-2 text-orange-700">
              ⭐ 評論樣本數
            </span>
            <span className="rounded-full bg-green-100 px-3 py-2 text-green-700">
              🛡️ 安心分數
            </span>
            <span className="rounded-full bg-stone-100 px-3 py-2 text-stone-700">
              📍 距離遠近
            </span>
            <span className="rounded-full bg-yellow-100 px-3 py-2 text-yellow-800">
              🕒 營業狀態
            </span>
          </div>
        </section>

        {loading && (
          <div className="mt-8 rounded-[28px] border-2 border-orange-100 bg-white/70 p-8 text-center">
            <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-orange-200 border-t-orange-500" />
            <p className="mt-4 text-xl font-black text-orange-600">
              正在幫你找不雷選擇...
            </p>
          </div>
        )}

        {!loading && results.length === 0 && (
          <div className="mt-8 rounded-[28px] border-2 border-stone-200 bg-white/70 p-8">
            <h2 className="text-2xl font-black">目前找不到足夠穩的選擇</h2>
            <p className="mt-3 leading-7 text-stone-600">
              可能是這類店家附近選擇較少，或 Google 評價樣本不足。可以換個關鍵字再試一次。
            </p>
          </div>
        )}

        {!loading && results.length > 0 && (
          <section className="mt-8 grid gap-5 md:grid-cols-2">
            {results.map((place, index) => (
              <div
                key={place.placeId}
                className="rounded-[28px] border-2 border-orange-100 bg-white/80 p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
              >
                <div className="text-sm font-black text-orange-500">
                  #{index + 1} BeLei 避雷候選
                </div>

                <h2 className="mt-2 text-3xl font-black leading-10">
                  {place.name}
                </h2>

                <div className="mt-4 flex flex-wrap gap-2 text-sm font-black">
                  <span
                    className={`rounded-full px-3 py-2 ${getSafetyStyle(
                      place.safetyScore
                    )}`}
                  >
                    🛡️ 安心 {place.safetyScore}/100
                  </span>

                  <span className="rounded-full bg-stone-100 px-3 py-2 text-stone-600">
                    ⭐ {place.rating ? place.rating.toFixed(1) : "無評分"}
                  </span>

                  <span className="rounded-full bg-stone-100 px-3 py-2 text-stone-600">
                    💬{" "}
                    {place.userRatingCount > 0
                      ? `${place.userRatingCount.toLocaleString()} 則`
                      : "評論不足"}
                  </span>

                  <span className="rounded-full bg-stone-100 px-3 py-2 text-stone-600">
                    📍 {formatDistance(place.distance)}
                  </span>

                  <span
                    className={`rounded-full px-3 py-2 ${
                      place.openNow
                        ? "bg-green-100 text-green-700"
                        : "bg-red-100 text-red-700"
                    }`}
                  >
                    {place.openNow ? "營業中" : "未營業/未知"}
                  </span>
                </div>

                <p className="mt-4 line-clamp-2 text-sm font-bold leading-6 text-stone-500">
                  {place.address || "地址資料不足"}
                </p>

                <button
                  type="button"
                  onClick={() =>
                    router.push(
                      `/restaurant/${place.placeId}?source=intent-search&distance=${
                        place.distance ?? 0
                      }`
                    )
                  }
                  className="mt-5 w-full rounded-2xl bg-orange-500 px-4 py-3 text-sm font-black text-white transition hover:bg-orange-600"
                >
                  查看避雷報告 →
                </button>
              </div>
            ))}
          </section>
        )}
      </div>
    </main>
  );
}