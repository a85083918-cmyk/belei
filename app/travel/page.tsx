"use client";

import { useRouter } from "next/navigation";

export default function TravelPage() {
  const router = useRouter();

  return (
    <main className="min-h-screen bg-[#fff8e8]">
      <section className="relative min-h-screen overflow-hidden bg-gradient-to-b from-stone-900 via-stone-800 to-[#fff8e8] px-6 pb-16 pt-24 text-center">
        <div className="mx-auto max-w-3xl">
          <div className="mb-4 text-5xl">🌍</div>

          <h1 className="text-4xl font-black text-white md:text-5xl">
            旅人避雷
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-stone-200">
            出國看不懂外文評價？
            <br />
            BeLei 幫你把附近餐廳評論整理成中文避雷報告，
            降低踩雷機率。
          </p>

          <button
            type="button"
            onClick={() => router.push("/nearby")}
            className="mt-10 rounded-[22px] bg-orange-500 px-8 py-4 text-lg font-black text-white shadow-lg transition hover:scale-105 hover:bg-orange-600"
          >
            📍 使用目前位置開始
          </button>
        </div>

        <div className="mx-auto mt-16 max-w-3xl rounded-[32px] border border-white/30 bg-white/90 p-7 text-left shadow-lg backdrop-blur">
          <div className="flex items-start gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-orange-50 text-3xl">
              🧭
            </div>

            <div>
              <h2 className="text-2xl font-black text-stone-900">
                出國吃飯前，先避雷
              </h2>

              <p className="mt-4 leading-8 text-stone-600">
                不論東京、首爾、香港或曼谷，都可以用地圖模式搜尋附近餐廳。
                BeLei 會把外文評論整理成中文重點，幫你快速判斷這間店值不值得吃。
              </p>

              <div className="mt-5 grid gap-3 text-sm font-black text-stone-700 sm:grid-cols-3">
                <div className="rounded-2xl bg-stone-50 px-4 py-3">
                  🌏 國外也能用
                </div>
                <div className="rounded-2xl bg-stone-50 px-4 py-3">
                  📝 中文避雷整理
                </div>
                <div className="rounded-2xl bg-stone-50 px-4 py-3">
                  💥 避免白跑踩雷
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}