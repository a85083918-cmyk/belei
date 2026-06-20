import { headers } from "next/headers";

type SearchPageProps = {
  searchParams: Promise<{
    q?: string;
  }>;
};

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
        raw: text,
      };
    }
  } catch (error: any) {
    return {
      places: [],
      message: error.message || "搜尋頁讀取 API 失敗",
    };
  }
}

function photoUrl(photoName: string | null) {
  if (!photoName) return null;
  return `/api/photo?name=${encodeURIComponent(photoName)}&w=900`;
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const params = await searchParams;
  const q = params.q?.trim() || "";

  const data = q ? await searchPlaces(q) : { places: [] };
  const places = data.places || [];

  return (
    <main className="min-h-screen bg-[#fff8e8] px-4 py-8 text-stone-900">
      <div className="mx-auto max-w-5xl">
        <a href="/" className="text-sm underline">
          ← 回首頁
        </a>

        <h1 className="mt-6 text-3xl font-bold">搜尋結果</h1>

        <p className="mt-2 text-stone-600">
          查詢：<span className="font-bold">{q || "未輸入"}</span>
        </p>

        {data.message && (
          <div className="mt-6 rounded-2xl border border-red-300 bg-red-50 p-4 text-red-700">
            {data.message}
          </div>
        )}

        {places.length === 0 ? (
          <div className="mt-8 rounded-3xl border border-stone-300 bg-white/70 p-6">
            找不到店家。請試試「高雄 老新台菜」或更完整店名。
          </div>
        ) : (
          <div className="mt-8 grid gap-6 md:grid-cols-2">
            {places.map((place: any) => {
              const img = photoUrl(place.photoName);

              return (
                <article
                  key={place.id}
                  className="overflow-hidden rounded-3xl border border-stone-300 bg-white/80 shadow-sm"
                >
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
              );
            })}
          </div>
        )}

        {data.debug && (
          <details className="mt-10 rounded-2xl bg-stone-900 p-4 text-xs text-white">
            <summary className="cursor-pointer">Debug</summary>
            <pre className="mt-4 whitespace-pre-wrap">
              {JSON.stringify(data.debug, null, 2)}
            </pre>
          </details>
        )}
      </div>
    </main>
  );
}