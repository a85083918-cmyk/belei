import { redirect } from "next/navigation";
import BackButton from "./BackButton";

type Place = {
  id: string;
  formattedAddress?: string;
  rating?: number;
  userRatingCount?: number;
  photoName?: string | null;
  currentOpeningHours?: {
    openNow?: boolean;
  };
  displayName?: {
    text?: string;
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
  return cityKeywords.some((city) =>
    text.includes(city)
  );
}

function getPhotoUrl(
  photoName?: string | null
) {
  if (!photoName) return null;

  return `/api/photo?name=${encodeURIComponent(
    photoName
  )}`;
}

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
  }>;
}) {
  const params = await searchParams;
  const keyword = params.q || "";
  await fetch("http://localhost:3000/api/search-count", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      keyword,
    }),
    cache: "no-store",
  });
  
  if (!keyword.trim()) {
    return (
      <EmptyState
        title="請輸入餐廳名稱"
        description="例如：老新台菜 高雄、丹丹漢堡 七賢店"
      />
    );
  }

  const res = await fetch(
    `http://localhost:3000/api/search?q=${encodeURIComponent(
      keyword
    )}`,
    {
      cache: "no-store",
    }
  );

  const data = await res.json();

  const places: Place[] =
    data.places || [];

  if (data.noCityMatch) {
    return (
      <EmptyState
        title="⚠️ 這個城市可能沒有分店"
        description={
          data.message ||
          `${keyword} 在指定城市沒有符合分店。`
        }
      />
    );
  }

  if (places.length === 0) {
    return (
      <EmptyState
        title="找不到符合的餐廳"
        description={`你搜尋的是：「${keyword}」。請確認店名或加上地區。`}
      />
    );
  }

  if (
    places.length > 5 &&
    !hasCityKeyword(keyword)
  ) {
    redirect(
      `/select-city?q=${encodeURIComponent(
        keyword
      )}`
    );
  }

  if (places.length === 1) {
    redirect(
      `/restaurant/${places[0].id}`
    );
  }

  return (
    <main className="min-h-screen bg-[#fff8e8] px-5 py-10 text-black">
      <div className="mx-auto max-w-4xl">
        <BackButton />

        <section className="mt-6 rounded-[30px] border-2 border-stone-800 bg-[#fffdf5] p-8 shadow-[8px_8px_0_#ead8b5]">
          <p className="text-sm font-black text-orange-500">
            BeLei 分店精準判定
          </p>

          <h1 className="mt-2 text-4xl font-black">
            請選擇你要查的分店
          </h1>

          <p className="mt-3 leading-8 text-stone-600">
            你搜尋的是：
            <span className="font-black text-black">
              {" "}
              {keyword}
            </span>

            <br />

            系統找到
            <span className="font-black text-orange-600">
              {" "}
              {places.length}{" "}
            </span>
            間可能分店，請先確認正確店家。
          </p>
        </section>

        <section className="mt-8 space-y-5">
          {places.map((place) => {
            const isOpen =
              place.currentOpeningHours
                ?.openNow;

            const photoUrl =
              getPhotoUrl(
                place.photoName
              );

            return (
              <a
                key={place.id}
                href={`/restaurant/${place.id}`}
                className="grid gap-5 rounded-[28px] border-2 border-stone-800 bg-[#fffdf5] p-5 shadow-[6px_6px_0_#ead8b5] transition hover:-translate-y-1 hover:bg-orange-50 md:grid-cols-[180px_1fr]"
              >
                <div className="h-40 overflow-hidden rounded-2xl bg-stone-100">
                  {photoUrl ? (
                    <img
                      src={photoUrl}
                      alt={
                        place.displayName
                          ?.text
                      }
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-5xl">
                      🍽️
                    </div>
                  )}
                </div>

                <div>
                  <h2 className="text-2xl font-black">
                    {place.displayName
                      ?.text ??
                      "未命名店家"}
                  </h2>

                  <p className="mt-3 leading-7 text-stone-600">
                    {place.formattedAddress ??
                      "地址未提供"}
                  </p>

                  <div className="mt-5 flex flex-wrap gap-3">
                    <Badge>
                      Google{" "}
                      {place.rating ??
                        "-"}
                      ★
                    </Badge>

                    <Badge>
                      {place.userRatingCount ??
                        0}{" "}
                      則評論
                    </Badge>

                    <span
                      className={`rounded-full px-4 py-2 text-sm font-black ${
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
                      點我產生
                      BeLei 報告
                    </Badge>
                  </div>
                </div>
              </a>
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
  const match =
    description.match(
      /^(.*?) 在/
    );

  const keyword =
    match?.[1] || "";

  const suggestCities = [
    "台北市",
    "高雄市",
    "台中市",
  ];

  return (
    <main className="min-h-screen bg-[#fff8e8] px-5 py-10 text-black">
      <div className="mx-auto max-w-3xl rounded-[30px] border-2 border-stone-800 bg-[#fffdf5] p-8 shadow-[8px_8px_0_#ead8b5]">
        <div className="text-5xl">
          ⚠️
        </div>

        <h1 className="mt-5 text-3xl font-black">
          {title}
        </h1>

        <p className="mt-4 leading-8 text-stone-600">
          {description}
        </p>

        {!!keyword && (
          <div className="mt-6 rounded-2xl border-2 border-orange-100 bg-orange-50 p-5">
            <h2 className="font-black text-orange-700">
              你是不是想改查其他城市？
            </h2>

            <div className="mt-4 flex flex-wrap gap-3">
              {suggestCities.map(
                (city) => (
                  <a
                    key={city}
                    href={`/search?q=${encodeURIComponent(
                      `${keyword} ${city}`
                    )}`}
                    className="rounded-full bg-white px-4 py-2 text-sm font-black text-orange-700 shadow-sm transition hover:bg-orange-100"
                  >
                    {keyword}{" "}
                    {city}
                  </a>
                )
              )}
            </div>
          </div>
        )}

        <div className="mt-8">
          <BackButton />
        </div>
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
    <span className="rounded-full bg-orange-100 px-4 py-2 text-sm font-black text-orange-700">
      {children}
    </span>
  );
}