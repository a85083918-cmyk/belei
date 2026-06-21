import Link from "next/link";
import { headers } from "next/headers";
import type { ReactNode } from "react";

type Place = {
  id: string;
  name?: string;
  address?: string;
  rating?: number | null;
  userRatingCount?: number | null;
  currentOpeningHours?: {
    openNow?: boolean;
  };
};

const CITY_LIST = ["台北", "新北", "桃園", "台中", "台南", "高雄"];

function normalizeText(text: string) {
  return text.replaceAll("臺", "台").trim();
}

function getCityFromKeyword(text: string): string | null {
  const q = normalizeText(text);

  if (q.includes("台北")) return "台北";
  if (q.includes("新北")) return "新北";
  if (q.includes("桃園")) return "桃園";
  if (q.includes("台中")) return "台中";
  if (q.includes("台南")) return "台南";
  if (q.includes("高雄")) return "高雄";

  return null;
}

function removeCityFromKeyword(text: string) {
  let result = normalizeText(text);

  CITY_LIST.forEach((city) => {
    result = result.replaceAll(city, "");
    result = result.replaceAll(`${city}市`, "");
  });

  return result.replace(/\s+/g, " ").trim();
}

function isPlaceInCity(place: Place, city: string | null) {
  if (!city) return true;
  return normalizeText(place.address || "").includes(city);
}

async function getBaseUrl() {
  const h = await headers();
  const host = h.get("host") || "localhost:3000";
  const proto = h.get("x-forwarded-proto") || "http";

  return `${proto}://${host}`;
}

async function searchPlaces(keyword: string) {
  try {
    const baseUrl = await getBaseUrl();

    const res = await fetch(
      `${baseUrl}/api/search?q=${encodeURIComponent(keyword)}`,
      { cache: "no-store" }
    );

    const text = await res.text();

    try {
      return JSON.parse(text);
    } catch {
      return {
        places: [],
        message: "API 回傳不是 JSON",
      };
    }
  } catch (error: any) {
    return {
      places: [],
      message: error.message || "搜尋失敗",
    };
  }
}

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
  }>;
}) {
  const params = await searchParams;
  const keyword = params.q?.trim() || "";

  if (!keyword) {
    return (
      <EmptyState
        title="請輸入餐廳名稱"
        description="例如：老新台菜 高雄、丹丹漢堡 七賢店"
      />
    );
  }

  const data = await searchPlaces(keyword);
  const rawPlaces: Place[] = data.places || [];

  const selectedCity = getCityFromKeyword(keyword);
  const cleanKeyword = removeCityFromKeyword(keyword);

  const places = selectedCity
    ? rawPlaces.filter((place) => isPlaceInCity(place, selectedCity))
    : rawPlaces;

  if (selectedCity && places.length === 0) {
    return (
      <NoCityMatchState
        keyword={cleanKeyword || keyword}
        city={selectedCity}
      />
    );
  }

  if (rawPlaces.length === 0) {
    return (
      <EmptyState
        title="找不到符合的餐廳"
        description={`你搜尋的是：「${keyword}」。請確認店名或加上地區。`}
      />
    );
  }

  if (!selectedCity && rawPlaces.length > 5) {
    return (
      <main className="min-h-screen bg-[#fff8e8] px-5 py-10 text-black">
        <div className="mx-auto max-w-4xl">
          <Link href="/" className="font-bold text-orange-500">
            ← 回首頁
          </Link>

          <section className="mt-6 rounded-3xl border border-gray-200 bg-white p-8 shadow-sm">
            <p className="text-sm font-bold text-orange-500">
              BeLei 分店精準判定
            </p>

            <h1 className="mt-2 text-4xl font-black">請先選擇縣市</h1>

            <p className="mt-3 leading-8 text-gray-600">
              你搜尋的是：
              <span className="font-bold text-black"> {keyword}</span>
              <br />
              這個品牌在多個縣市都有分店。
            </p>

            <div className="mt-8 flex flex-wrap gap-4">
              {CITY_LIST.map((city) => (
                <Link
                  key={city}
                  href={`/search?q=${encodeURIComponent(`${city} ${keyword}`)}`}
                  className="rounded-2xl border border-gray-200 bg-orange-50 px-6 py-4 font-bold transition hover:bg-orange-100"
                >
                  {city}
                </Link>
              ))}
            </div>
          </section>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#fff8e8] px-5 py-10 text-black">
      <div className="mx-auto max-w-4xl">
        <Link href="/" className="font-bold text-orange-500">
          ← 回首頁
        </Link>

        <section className="mt-6 rounded-3xl border border-gray-200 bg-white p-8 shadow-sm">
          <p className="text-sm font-bold text-orange-500">
            BeLei 分店精準判定
          </p>

          <h1 className="mt-2 text-4xl font-black">請選擇你要查的分店</h1>

          <p className="mt-3 leading-8 text-gray-600">
            你搜尋的是：
            <span className="font-bold text-black"> {keyword}</span>
            <br />
            {selectedCity
              ? `目前只顯示 ${selectedCity} 的符合分店。`
              : "系統找到多個可能分店，請先確認正確店家。"}
          </p>
        </section>

        <section className="mt-8 space-y-4">
          {places.map((place) => {
            const isOpen = place.currentOpeningHours?.openNow;

            return (
              <Link
                key={place.id}
                href={`/restaurant/${encodeURIComponent(place.id)}`}
                className="block rounded-3xl border border-gray-200 bg-white p-6 shadow-sm transition hover:border-orange-300 hover:bg-orange-50"
              >
                <h2 className="text-2xl font-black">
                  {place.name ?? "未命名店家"}
                </h2>

                <p className="mt-3 leading-7 text-gray-600">
                  {place.address ?? "地址未提供"}
                </p>

                <div className="mt-4 flex flex-wrap gap-3">
                  <Badge>Google {place.rating ?? "-"}★</Badge>
                  <Badge>{place.userRatingCount ?? 0} 則評論</Badge>

                  <span
                    className={`rounded-full px-4 py-2 text-sm font-bold ${
                      isOpen
                        ? "bg-green-100 text-green-700"
                        : "bg-red-100 text-red-700"
                    }`}
                  >
                    {isOpen ? "營業中" : "目前未營業"}
                  </span>

                  <Badge>點我產生 BeLei 報告</Badge>
                </div>
              </Link>
            );
          })}
        </section>
      </div>
    </main>
  );
}

function NoCityMatchState({
  keyword,
  city,
}: {
  keyword: string;
  city: string;
}) {
  return (
    <main className="min-h-screen bg-[#fff8e8] px-5 py-10 text-black">
      <div className="mx-auto max-w-md">
        <div className="rounded-[32px] border-[3px] border-stone-900 bg-[#fffdf7] p-8 shadow-[8px_8px_0px_#f3e7c9]">
          <div className="mb-4 text-5xl">⚠️</div>

          <h1 className="text-3xl font-black leading-tight">
            ⚠️ 這個城市可能沒有分店
          </h1>

          <p className="mt-5 text-lg leading-8 text-stone-600">
            <span className="font-bold">{keyword}</span> 在{" "}
            <span className="font-bold">{city}</span>{" "}
            可能沒有符合的餐飲分店，建議改查其他城市或確認店名。
          </p>

          <Link
            href="/"
            className="mt-8 inline-flex rounded-2xl bg-orange-500 px-6 py-3 font-bold text-white shadow-lg transition hover:scale-105"
          >
            回首頁重新搜尋
          </Link>
        </div>
      </div>
    </main>
  );
}

function EmptyState({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <main className="min-h-screen bg-[#fff8e8] px-5 py-10 text-black">
      <div className="mx-auto max-w-md rounded-[32px] border-[3px] border-stone-900 bg-[#fffdf7] p-8 shadow-[8px_8px_0px_#f3e7c9]">
        <div className="text-5xl">⚠️</div>

        <h1 className="mt-5 text-3xl font-black leading-tight">{title}</h1>

        <p className="mt-5 text-lg leading-8 text-stone-600">{description}</p>

        <Link
          href="/"
          className="mt-8 inline-flex rounded-2xl bg-orange-500 px-6 py-3 font-bold text-white shadow-lg transition hover:scale-105"
        >
          回首頁重新搜尋
        </Link>
      </div>
    </main>
  );
}

function Badge({ children }: { children: ReactNode }) {
  return (
    <span className="rounded-full bg-orange-100 px-4 py-2 text-sm font-bold text-orange-700">
      {children}
    </span>
  );
}