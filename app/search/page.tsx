import Link from "next/link";
import { headers } from "next/headers";

type SearchPageProps = {
  searchParams: Promise<{
    q?: string;
  }>;
};

type Place = {
  id: string;
  name: string;
  address: string;
  rating?: number | null;
  userRatingCount?: number | null;
  photoName?: string | null;
};

const CITY_WORDS = ["台北", "臺北", "新北", "桃園", "台中", "臺中", "台南", "臺南", "高雄"];

function normalizeCity(city: string) {
  return city.replaceAll("臺", "台");
}

function getCityFromQuery(q: string): string | null {
  if (q.includes("高雄")) return "高雄";
  if (q.includes("台中") || q.includes("臺中")) return "台中";
  if (q.includes("台南") || q.includes("臺南")) return "台南";
  if (q.includes("台北") || q.includes("臺北")) return "台北";
  if (q.includes("新北")) return "新北";
  if (q.includes("桃園")) return "桃園";
  return null;
}

function removeCityWords(q: string) {
  let result = q;
  CITY_WORDS.forEach((city) => {
    result = result.replaceAll(city, "");
  });
  return result.trim();
}

function getCityFromAddress(address = ""): string | null {
  if (address.includes("高雄")) return "高雄";
  if (address.includes("台中") || address.includes("臺中")) return "台中";
  if (address.includes("台南") || address.includes("臺南")) return "台南";
  if (address.includes("台北") || address.includes("臺北")) return "台北";
  if (address.includes("新北")) return "新北";
  if (address.includes("桃園")) return "桃園";
  return null;
}

async function getBaseUrl() {
  const h = await headers();
  const host = h.get("host");
  const proto = h.get("x-forwarded-proto") || "https";
  return `${proto}://${host}`;
}

async function searchPlaces(q: string) {
  const baseUrl = await getBaseUrl();

  try {
    const res = await fetch(`${baseUrl}/api/search?q=${encodeURIComponent(q)}`, {
      cache: "no-store",
    });

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
      message: error.message || "搜尋頁讀取 API 失敗",
    };
  }
}

function photoUrl(photoName: string | null | undefined) {
  if (!photoName) return null;
  return `/api/photo?name=${encodeURIComponent(photoName)}&w=900`;
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const params = await searchParams;
  const q = params.q?.trim() || "";

  const selectedCity = getCityFromQuery(q);
  const cleanQuery = removeCityWords(q);

  const data = q ? await searchPlaces(q) : { places: [] };
  const allPlaces: Place[] = data.places || [];

  const cityList: string[] = Array.from(
    new Set<string>(
      allPlaces
        .map((place: Place) => getCityFromAddress(place.address))
        .filter((city: string | null): city is string => Boolean(city))
        .map((city: string) => normalizeCity(city))
    )
  );

  const shouldShowCitySelector = !selectedCity && cityList.length > 1;

  const places: Place[] = shouldShowCitySelector
    ? []
    : selectedCity
      ? allPlaces.filter((place: Place) =>
          normalizeCity(place.address || "").includes(normalizeCity(selectedCity))
        )
      : allPlaces;

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#fff8e8] px-4 py-8 text-stone-900">
      <div className="pointer-events-none absolute inset-0 opacity-40">
        <div className="absolute left-10 top-20 h-40 w-40 rounded-full bg-orange-100 blur-3xl" />
        <div className="absolute right-20 top-32 h-52 w-52 rounded-full bg-yellow-100 blur-3xl" />
        <div className="absolute bottom-20 left-1/3 h-56 w-56 rounded-full bg-amber-100 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-5xl">
        <Link href="/" className="text-sm underline">
          ← 回首頁
        </Link>

        <h1 className="mt-6 text-4xl font-bold tracking-wide">搜尋結果</h1>

        <p className="mt-3 text-stone-600">
          查詢：<span className="font-bold">{q || "未輸入"}</span>
        </p>

        {data.message && (
          <div className="mt-6 rounded-2xl border border-red-300 bg-red-50 p-4 text-red-700">
            {data.message}
          </div>
        )}

        {shouldShowCitySelector && (
          <section className="mt-8 rounded-[2rem] border border-stone-300 bg-white/80 p-6 shadow-sm">
            <p className="text-sm text-stone-500">同名店家分布在不同縣市</p>
            <h2 className="mt-2 text-2xl font-bold">請先選擇你要查詢的縣市</h2>

            <div className="mt-5 flex flex-wrap gap-3">
              {cityList.map((city: string) => (
                <Link
                  key={city}
                  href={`/search?q=${encodeURIComponent(`${city} ${cleanQuery}`)}`}
                  className="rounded-full border border-stone-300 bg-[#fff3cf] px-5 py-3 font-bold shadow-sm transition hover:-translate-y-0.5 hover:bg-[#ffe29a]"
                >
                  {city}
                </Link>
              ))}
            </div>

            <p className="mt-5 text-sm text-stone-500">
              例如：搜尋「台中 肯德基」後，才會顯示該縣市的分店。
            </p>
          </section>
        )}

        {!shouldShowCitySelector && places.length === 0 && (
          <div className="mt-8 rounded-3xl border border-stone-300 bg-white/70 p-6">
            找不到店家。請試試「高雄 老新台菜」或更完整店名。
          </div>
        )}

        {!shouldShowCitySelector && places.length > 0 && (
          <div className="mt-8 grid gap-6 md:grid-cols-2">
            {places.map((place: Place) => {
              const img = photoUrl(place.photoName);

              return (
                <Link
                  key={place.id}
                  href={`/restaurant/${encodeURIComponent(place.id)}`}
                  className="block transition hover:-translate-y-1 hover:opacity-95"
                >
                  <article className="overflow-hidden rounded-3xl border border-stone-300 bg-white/85 shadow-sm">
                    <div className="h-52 bg-stone-200">
                      {img ? (
                        <img
                          src={img}
                          alt={place.name}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center text-stone-500">
                          暫無店家圖片
                        </div>
                      )}
                    </div>

                    <div className="p-5">
                      <h2 className="text-xl font-bold">{place.name}</h2>
                      <p className="mt-2 text-sm text-stone-600">
                        {place.address}
                      </p>

                      <div className="mt-4 flex gap-3 text-sm">
                        <span>⭐ {place.rating ?? "無評分"}</span>
                        <span>評論 {place.userRatingCount ?? 0}</span>
                      </div>
                    </div>
                  </article>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}