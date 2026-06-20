"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type RankingItem = {
  name: string;
  query: string;
  subtitle: string;
};

type HomeRankings = {
  hotSearches: RankingItem[];
  expectationGap: RankingItem[];
  stableStores: RankingItem[];
};

export default function AdminPage() {
  const [loading, setLoading] = useState(false);
  const [rankings, setRankings] = useState<HomeRankings | null>(null);
  const [message, setMessage] = useState("");

  useEffect(() => {
    loadRankings();
  }, []);

  async function loadRankings() {
    const res = await fetch("/api/home-rankings", {
      cache: "no-store",
    });

    const data = await res.json();

    setRankings({
      hotSearches: data.hotSearches || [],
      expectationGap: data.expectationGap || [],
      stableStores: data.stableStores || [],
    });
  }

  async function handleGenerateRankings() {
    try {
      setLoading(true);
      setMessage("");

      const res = await fetch("/api/generate-rankings", {
        method: "POST",
      });

      const data = await res.json();

      if (!data.ok) {
        throw new Error("產榜失敗");
      }

      await loadRankings();

      setMessage("✅ 首頁排行榜已重新產生");
    } catch (error) {
      console.error(error);
      setMessage("❌ 產榜失敗");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#fff8e8] px-5 py-10 text-black">
      <div className="mx-auto max-w-5xl">
        <div className="rounded-[32px] border-2 border-stone-800 bg-[#fffdf5] p-8 shadow-[8px_8px_0_#ead8b5]">
          <div className="inline-block rounded-full bg-orange-100 px-4 py-2 text-sm font-black text-orange-600">
            BeLei Admin
          </div>

          <h1 className="mt-5 text-4xl font-black">首頁排行榜管理</h1>

          <p className="mt-4 leading-8 text-stone-600">
            按下按鈕後，系統會依據目前搜尋紀錄重新產生首頁排行榜。
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <button
              onClick={handleGenerateRankings}
              disabled={loading}
              className="rounded-2xl bg-orange-500 px-8 py-4 text-lg font-black text-white transition hover:bg-orange-600 disabled:opacity-50"
            >
              {loading ? "產榜中..." : "重新產生首頁排行榜"}
            </button>

            <Link
              href="/"
              className="rounded-2xl border-2 border-stone-800 bg-white px-8 py-4 text-center text-lg font-black text-stone-800 transition hover:bg-orange-50"
            >
              查看首頁
            </Link>
          </div>

          {!!message && (
            <div className="mt-6 rounded-2xl bg-stone-100 px-5 py-4 font-black">
              {message}
            </div>
          )}
        </div>

        <section className="mt-8 grid gap-6 md:grid-cols-3">
          <AdminRankingCard
            title="🔥 目前熱門搜尋"
            items={rankings?.hotSearches || []}
          />

          <AdminRankingCard
            title="💥 目前期待落差榜"
            items={rankings?.expectationGap || []}
          />

          <AdminRankingCard
            title="⭐ 目前最穩定榜"
            items={rankings?.stableStores || []}
          />
        </section>
      </div>
    </main>
  );
}

function AdminRankingCard({
  title,
  items,
}: {
  title: string;
  items: RankingItem[];
}) {
  return (
    <div className="rounded-[28px] border-2 border-stone-800 bg-white p-6 shadow-[6px_6px_0_#ead8b5]">
      <h2 className="text-2xl font-black">{title}</h2>

      <div className="mt-6 space-y-4">
        {items.length === 0 && (
          <div className="rounded-2xl bg-stone-100 p-4 text-sm font-bold text-stone-500">
            尚無資料
          </div>
        )}

        {items.map((item, index) => (
          <div
            key={`${item.query}-${index}`}
            className="rounded-2xl bg-stone-50 p-4"
          >
            <div className="text-sm font-black text-orange-500">
              #{index + 1}
            </div>

            <div className="mt-1 text-lg font-black text-stone-800">
              {item.name}
            </div>

            <div className="mt-1 text-sm font-bold text-stone-500">
              {item.subtitle}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}