"use client";

import { useSearchParams, useRouter } from "next/navigation";

const cities = [
  "台北市",
  "新北市",
  "桃園市",
  "台中市",
  "台南市",
  "高雄市",
];

export default function SelectCityPage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const keyword = searchParams.get("q") || "";

  function handleSelectCity(city: string) {
    router.push(`/search?q=${encodeURIComponent(`${keyword} ${city}`)}`);
  }

  return (
    <main className="min-h-screen bg-[#FAFAFA] px-5 py-10 text-black">
      <div className="mx-auto max-w-4xl">
        <a href="/" className="font-bold text-orange-500">
          ← 回首頁
        </a>

        <section className="mt-6 rounded-3xl border border-gray-200 bg-white p-8 shadow-sm">
          <p className="text-sm font-bold text-orange-500">
            BeLei 分店精準判定
          </p>

          <h1 className="mt-2 text-4xl font-black">
            你想查哪個地區？
          </h1>

          <p className="mt-3 leading-8 text-gray-600">
            你搜尋的是：
            <span className="font-bold text-black"> {keyword}</span>
            <br />
            這類店家可能有多家分店，請先選擇地區，避免 BeLei 判錯店。
          </p>
        </section>

        <section className="mt-8 grid gap-4 sm:grid-cols-2 md:grid-cols-3">
          {cities.map((city) => (
            <button
              key={city}
              onClick={() => handleSelectCity(city)}
              className="rounded-3xl border border-gray-200 bg-white p-8 text-left shadow-sm transition hover:border-orange-300 hover:bg-orange-50"
            >
              <div className="text-4xl">📍</div>

              <h2 className="mt-4 text-2xl font-black">
                {city}
              </h2>

              <p className="mt-2 text-gray-500">
                搜尋 {keyword} {city}
              </p>
            </button>
          ))}
        </section>
      </div>
    </main>
  );
}