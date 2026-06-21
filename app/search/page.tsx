import Link from "next/link";
import { headers } from "next/headers";

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

const cityKeywords = [
  "台北",
  "新北",
  "桃園",
  "台中",
  "台南",
  "高雄",
];

function hasCityKeyword(text: string) {
  return cityKeywords.some((city) => text.includes(city));
}

async function getBaseUrl() {
  const h = await headers();
  const host = h.get("host");
  const proto = h.get("x-forwarded-proto") || "https";

  return `${proto}://${host}`;
}

async function searchPlaces(keyword: string) {
  try {
    const baseUrl = await getBaseUrl();

    const res = await fetch(
      `${baseUrl}/api/search?q=${encodeURIComponent(keyword)}`,
      {
        cache: "no-store",
      }
    );

    return await res.json();
  } catch (e: any) {
    return {
      places: [],
      message: e.message,
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

  const places: Place[] = data.places || [];

  if (places.length === 0) {
    return (
      <EmptyState
        title="找不到符合的餐廳"
        description={`你搜尋的是：「${keyword}」`}
      />
    );
  }

  //
  // 超過五家且沒指定縣市
  //
  if (places.length > 5 && !hasCityKeyword(keyword)) {
    return (
      <main className="min-h-screen bg-[#FAFAFA] px-5 py-10">
        <div className="mx-auto max-w-4xl">
          <Link href="/" className="font-bold text-orange-500">
            ← 回首頁
          </Link>

          <section className="mt-6 rounded-3xl border border-gray-200 bg-white p-8 shadow-sm">
            <p className="text-sm font-bold text-orange-500">
              BeLei 分店精準判定
            </p>

            <h1 className="mt-2 text-4xl font-black">
              請先選擇縣市
            </h1>

            <p className="mt-3 text-gray-600 leading-8">
              你搜尋的是：
              <span className="font-bold text-black">
                {" "}
                {keyword}
              </span>
              <br />
              這個品牌在多個縣市都有分店。
            </p>

            <div className="mt-8 flex flex-wrap gap-4">
              {cityKeywords.map((city) => (
                <Link
                  key={city}
                  href={`/search?q=${encodeURIComponent(
                    `${city} ${keyword}`
                  )}`}
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

  //
  // 一家店直接顯示卡片
  //
  return (
    <main className="min-h-screen bg-[#FAFAFA] px-5 py-10 text-black">
      <div className="mx-auto max-w-4xl">
        <Link href="/" className="font-bold text-orange-500">
          ← 回首頁
        </Link>

        <section className="mt-6 rounded-3xl border border-gray-200 bg-white p-8 shadow-sm">
          <p className="text-sm font-bold text-orange-500">
            BeLei 分店精準判定
          </p>

          <h1 className="mt-2 text-4xl font-black">
            請選擇你要查的分店
          </h1>

          <p className="mt-3 leading-8 text-gray-600">
            你搜尋的是：
            <span className="font-bold text-black">
              {" "}
              {keyword}
            </span>
            <br />
            系統找到多個可能分店，請先確認正確店家。
          </p>
        </section>

        <section className="mt-8 space-y-4">
          {places.map((place) => {
            const isOpen =
              place.currentOpeningHours?.openNow;

            return (
              <Link
                key={place.id}
                href={`/restaurant/${encodeURIComponent(
                  place.id
                )}`}
                className="block rounded-3xl border border-gray-200 bg-white p-6 shadow-sm transition hover:border-orange-300 hover:bg-orange-50"
              >
                <h2 className="text-2xl font-black">
                  {place.name ?? "未命名店家"}
                </h2>

                <p className="mt-3 leading-7 text-gray-600">
                  {place.address ?? "地址未提供"}
                </p>

                <div className="mt-4 flex flex-wrap gap-3">
                  <Badge>
                    Google {place.rating ?? "-"}★
                  </Badge>

                  <Badge>
                    {place.userRatingCount ?? 0} 則評論
                  </Badge>

                  <span
                    className={`rounded-full px-4 py-2 text-sm font-bold ${
                      isOpen
                        ? "bg-green-100 text-green-700"
                        : "bg-red-100 text-red-700"
                    }`}
                  >
                    {isOpen
                      ? "營業中"
                      : "目前未營業"}
                  </span>

                  <Badge>
                    點我產生 BeLei 報告
                  </Badge>
                </div>
              </Link>
            );
          })}
        </section>
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
    <main className="min-h-screen bg-[#FAFAFA] px-5 py-10">
      <div className="mx-auto max-w-3xl rounded-3xl border border-gray-200 bg-white p-8 shadow-sm">
        <div className="text-5xl">⚠️</div>

        <h1 className="mt-5 text-3xl font-black">
          {title}
        </h1>

        <p className="mt-3 leading-8 text-gray-600">
          {description}
        </p>

        <Link
          href="/"
          className="mt-6 inline-block rounded-2xl bg-orange-500 px-6 py-3 font-bold text-white"
        >
          回首頁重新搜尋
        </Link>
      </div>
    </main>
  );
}

function Badge({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <span className="rounded-full bg-orange-100 px-4 py-2 text-sm font-bold text-orange-700">
      {children}
    </span>
  );
}