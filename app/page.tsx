"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

type StoreItem = {
  name: string;
  query: string;
  subtitle: string;
  photoName?: string | null;
};

type ApiStoreItem = {
  name: string;
  query: string;
  subtitle?: string;
  area?: string;
  reason?: string;
  risk?: string;
  strength?: string;
  photoName?: string | null;
};

const hotSearches: StoreItem[] = [
  { name: "老新台菜", query: "老新台菜 高雄", subtitle: "被搜尋 6,215 次" },
  { name: "丹丹漢堡", query: "丹丹漢堡 高雄", subtitle: "被搜尋 4,992 次" },
  { name: "紅茶老爹", query: "紅茶老爹", subtitle: "被搜尋 4,201 次" },
  { name: "50嵐", query: "50嵐", subtitle: "被搜尋 3,890 次" },
  { name: "老四川", query: "老四川", subtitle: "被搜尋 3,210 次" },
];

const expectationGap: StoreItem[] = [
  { name: "老四川", query: "老四川", subtitle: "期待落差指數 92" },
  { name: "陶板屋", query: "陶板屋", subtitle: "期待落差指數 89" },
  { name: "王品牛排", query: "王品牛排", subtitle: "期待落差指數 87" },
];

const stableStores: StoreItem[] = [
  { name: "饗食天堂", query: "饗食天堂", subtitle: "穩定度 88%" },
  { name: "漢來海港", query: "漢來海港", subtitle: "穩定度 85%" },
  { name: "燒肉眾", query: "燒肉眾", subtitle: "穩定度 82%" },
];

function normalizeStores(items?: ApiStoreItem[]): StoreItem[] {
  if (!items || !Array.isArray(items)) return [];

  return items.map((item) => ({
    name: item.name,
    query: item.query,
    subtitle: item.subtitle || item.area || "餐廳",
    photoName: item.photoName ?? null,
  }));
}

function normalizeSearchKeyword(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function getPhotoUrl(photoName?: string | null) {
  if (!photoName) return null;
  return `/api/photo?name=${encodeURIComponent(photoName)}&w=600`;
}

export default function Home() {
  const router = useRouter();
  const recentRef = useRef<HTMLDivElement>(null);

  const [keyword, setKeyword] = useState("");
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [showRecent, setShowRecent] = useState(false);

  const [hotStores, setHotStores] = useState<StoreItem[]>(hotSearches);
  const [gapStores, setGapStores] = useState<StoreItem[]>(expectationGap);
  const [stableStoreList, setStableStoreList] =
    useState<StoreItem[]>(stableStores);

  useEffect(() => {
    loadHomeRankings();

    const history = localStorage.getItem("belei-recent-searches");
    if (history) {
      try {
        setRecentSearches(JSON.parse(history));
      } catch {
        setRecentSearches([]);
      }
    }
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (recentRef.current && !recentRef.current.contains(event.target as Node)) {
        setShowRecent(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function loadHomeRankings() {
    try {
      const res = await fetch("/api/home-rankings", { cache: "no-store" });
      if (!res.ok) throw new Error("首頁排行榜 API 載入失敗");

      const data = await res.json();

      const hot = normalizeStores(data.hotSearches);
      const gap = normalizeStores(data.expectationGap);
      const stable = normalizeStores(data.stableStores);

      await loadHomePhotos(
        hot.length ? hot : hotSearches,
        gap.length ? gap : expectationGap,
        stable.length ? stable : stableStores
      );
    } catch (error) {
      console.error("首頁排行榜載入失敗，改用預設資料", error);
      await loadHomePhotos(hotSearches, expectationGap, stableStores);
    }
  }

  async function loadHomePhotos(
    hotSource: StoreItem[],
    gapSource: StoreItem[],
    stableSource: StoreItem[]
  ) {
    const [hot, gap, stable] = await Promise.all([
      attachPhotos(hotSource),
      attachPhotos(gapSource),
      attachPhotos(stableSource),
    ]);

    setHotStores(hot);
    setGapStores(gap);
    setStableStoreList(stable);
  }

  async function attachPhotos(stores: StoreItem[]) {
    return await Promise.all(
      stores.map(async (store) => {
        try {
          const res = await fetch(`/api/search?q=${encodeURIComponent(store.query)}`);
          const data = await res.json();
          const firstPlace = data.places?.[0];

          return {
            ...store,
            photoName: firstPlace?.photoName ?? null,
          };
        } catch (error) {
          console.error("首頁照片載入失敗", store.name, error);
          return store;
        }
      })
    );
  }

  function handleSearch(value?: string) {
    const searchKeyword = normalizeSearchKeyword(value || keyword);
    if (!searchKeyword) return;

    const history = JSON.parse(
      localStorage.getItem("belei-recent-searches") || "[]"
    ) as string[];

    const nextHistory = [
      searchKeyword,
      ...history.filter((item) => item !== searchKeyword),
    ].slice(0, 5);

    localStorage.setItem("belei-recent-searches", JSON.stringify(nextHistory));
    setRecentSearches(nextHistory);
    setShowRecent(false);

    router.push(`/search?q=${encodeURIComponent(searchKeyword)}`);
  }

  function clearRecentSearches() {
    localStorage.removeItem("belei-recent-searches");
    setRecentSearches([]);
    setShowRecent(false);
  }

  return (
    <main className="min-h-screen bg-[#fff8e8] text-stone-950">
      <section className="relative overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: "url('/home/hero.jpg')" }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/45 to-[#fff8e8]" />

        <div className="relative mx-auto flex min-h-[430px] max-w-5xl flex-col px-4 pb-12 pt-6 text-white md:min-h-[560px]">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-black tracking-tight md:text-6xl">
              Be<span className="text-orange-500">Lei</span>
            </h1>
            <div className="text-2xl">🔔</div>
          </div>

          <div className="mt-14 text-center md:mt-20">
            <div className="mx-auto w-fit rounded-full bg-white/15 px-5 py-2 text-sm font-black text-orange-200 backdrop-blur">
              吃之前，先查查
            </div>

            <h2 className="mt-5 text-5xl font-black leading-tight md:text-7xl">
              吃之前，
              <br />
              先<span className="text-orange-400">查查</span>
            </h2>

            <p className="mt-4 text-lg font-bold leading-8 text-white/90 md:text-2xl">
              Google 告訴你有多紅
              <br />
              我們告訴你會不會後悔
            </p>
          </div>

          <div
            ref={recentRef}
            className="relative mx-auto mt-8 w-full max-w-3xl rounded-[26px] border border-white/30 bg-white p-2 shadow-[0_18px_45px_rgba(0,0,0,0.25)]"
          >
            <div className="flex gap-2">
              <input
                type="text"
                value={keyword}
                onFocus={() => setShowRecent(true)}
                onChange={(e) => setKeyword(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSearch();
                  if (e.key === "Escape") setShowRecent(false);
                }}
                placeholder="輸入餐廳名稱，例如：老新台菜"
                className="min-w-0 flex-1 rounded-2xl bg-stone-50 px-4 py-4 text-sm font-bold text-stone-800 outline-none focus:bg-orange-50 md:text-lg"
              />

              <button
                onClick={() => handleSearch()}
                className="shrink-0 rounded-2xl bg-orange-500 px-5 py-4 text-lg font-black text-white hover:bg-orange-600 md:px-8"
              >
                搜尋
              </button>
            </div>

            {showRecent && recentSearches.length > 0 && (
              <div className="absolute left-0 right-0 top-full z-30 mt-3 overflow-hidden rounded-[24px] border border-stone-100 bg-white text-left shadow-[6px_6px_0_#ead8b5]">
                <div className="flex items-center justify-between px-5 py-4">
                  <div className="text-sm font-black text-stone-500">🕒 最近搜尋</div>

                  <button
                    type="button"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      clearRecentSearches();
                    }}
                    className="text-xs font-black text-orange-500 hover:text-orange-600"
                  >
                    清除
                  </button>
                </div>

                <div className="pb-2">
                  {recentSearches.map((item) => (
                    <button
                      key={item}
                      type="button"
                      onMouseDown={(e) => {
                        e.preventDefault();
                        handleSearch(item);
                      }}
                      className="flex w-full items-center px-5 py-3 font-bold text-stone-700 transition hover:bg-orange-50"
                    >
                      {item}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="mx-auto -mt-8 flex max-w-5xl flex-col px-4 pb-10 md:mt-10">
        <div className="space-y-4 md:hidden">
          <FixedImageRankCard
            label="💥 今日踩雷榜 TOP 1"
            name={gapStores[0]?.name || "老四川"}
            subtitle="期待落差指數"
            score="92"
            meta="被搜尋 2,104 次"
            imageSrc="/home/risk-card.jpg"
            tone="red"
            query={gapStores[0]?.query || "老四川"}
            onSearch={handleSearch}
          />

          <FixedImageRankCard
            label="⭐ 本週穩定榜 TOP 1"
            name={stableStoreList[0]?.name || "饗食天堂"}
            subtitle="穩定度"
            score="88%"
            meta="被搜尋 6,215 次"
            imageSrc="/home/stable-card.jpg"
            tone="green"
            query={stableStoreList[0]?.query || "饗食天堂"}
            onSearch={handleSearch}
          />

          <MobileHotList stores={hotStores} onSearch={handleSearch} />
        </div>

        <section className="hidden w-full gap-6 md:grid md:grid-cols-3">
          <HomeCard
            title="🔥 熱門搜尋"
            subtitle="大家最近正在查的餐廳"
            stores={hotStores}
            onSearch={handleSearch}
          />

          <HomeCard
            title="💥 本週期待落差最高"
            subtitle="Google 高分，但 BeLei 可能提醒你小心"
            stores={gapStores}
            onSearch={handleSearch}
          />

          <HomeCard
            title="⭐ 本週最穩定"
            subtitle="近期評論相對穩定，踩雷風險較低"
            stores={stableStoreList}
            onSearch={handleSearch}
          />
        </section>
      </section>
    </main>
  );
}

function FixedImageRankCard({
  label,
  name,
  subtitle,
  score,
  meta,
  imageSrc,
  tone,
  query,
  onSearch,
}: {
  label: string;
  name: string;
  subtitle: string;
  score: string;
  meta: string;
  imageSrc: string;
  tone: "red" | "green";
  query: string;
  onSearch: (value: string) => void;
}) {
  const toneClass =
    tone === "red"
      ? {
          card: "bg-red-50 border-red-100",
          pill: "bg-red-100 text-red-600",
          score: "text-red-600",
          button: "border-red-400 text-red-600",
        }
      : {
          card: "bg-green-50 border-green-100",
          pill: "bg-green-100 text-green-700",
          score: "text-green-700",
          button: "border-green-500 text-green-700",
        };

  return (
    <button
      onClick={() => onSearch(query)}
      className={`block w-full overflow-hidden rounded-[28px] border p-4 text-left shadow-[5px_5px_0_#ead8b5] ${toneClass.card}`}
    >
      <div className="flex gap-4">
        <div className="flex flex-1 flex-col justify-between">
          <div>
            <div className={`w-fit rounded-2xl px-3 py-2 text-xs font-black ${toneClass.pill}`}>
              {label}
            </div>

            <h3 className="mt-4 text-3xl font-black">{name}</h3>

            <p className="mt-3 text-base font-bold text-stone-700">
              {subtitle}{" "}
              <span className={`text-2xl font-black ${toneClass.score}`}>{score}</span>
            </p>

            <p className="mt-1 text-sm font-bold text-stone-600">{meta}</p>
          </div>

          <div
            className={`mt-4 w-fit rounded-2xl border bg-white px-4 py-2 text-sm font-black ${toneClass.button}`}
          >
            查看分析報告
          </div>
        </div>

        <div className="h-40 w-[42%] shrink-0 overflow-hidden rounded-3xl bg-stone-200">
          <img src={imageSrc} alt={name} className="h-full w-full object-cover" />
        </div>
      </div>
    </button>
  );
}

function MobileHotList({
  stores,
  onSearch,
}: {
  stores: StoreItem[];
  onSearch: (value: string) => void;
}) {
  return (
    <div className="rounded-[28px] border border-stone-200 bg-white p-5 text-left shadow-[5px_5px_0_#ead8b5]">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-black">🔥 熱門搜尋 TOP 5</h2>
      </div>

      <div className="mt-5 flex gap-3 overflow-x-auto pb-2">
        {stores.slice(0, 5).map((store, index) => {
          const photoUrl = getPhotoUrl(store.photoName);

          return (
            <button
              key={store.query}
              onClick={() => onSearch(store.query)}
              className="w-[118px] shrink-0 text-left"
            >
              <div className="relative h-28 overflow-hidden rounded-2xl bg-stone-200 shadow-sm">
                {photoUrl ? (
                  <img src={photoUrl} alt={store.name} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full items-center justify-center text-4xl">🍽️</div>
                )}

                <div className="absolute left-2 top-2 flex h-7 w-7 items-center justify-center rounded-lg bg-orange-500 text-sm font-black text-white">
                  {index + 1}
                </div>
              </div>

              <div className="mt-3 truncate text-lg font-black text-stone-900">
                {store.name}
              </div>
              <div className="mt-1 truncate text-sm font-bold text-stone-400">
                {store.subtitle}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function HomeCard({
  title,
  subtitle,
  stores,
  onSearch,
}: {
  title: string;
  subtitle: string;
  stores: StoreItem[];
  onSearch: (value: string) => void;
}) {
  return (
    <div className="rounded-[28px] border border-stone-200 bg-white p-8 text-left shadow-sm">
      <h2 className="text-2xl font-black">{title}</h2>
      <p className="mt-2 text-sm font-bold text-stone-500">{subtitle}</p>

      <div className="mt-8 space-y-4">
        {stores.map((store) => {
          const photoUrl = getPhotoUrl(store.photoName);

          return (
            <button
              key={store.query}
              onClick={() => onSearch(store.query)}
              className="w-full overflow-hidden rounded-2xl bg-stone-50 text-left shadow-sm transition hover:bg-orange-50"
            >
              <div className="h-28 w-full bg-stone-200">
                {photoUrl ? (
                  <img src={photoUrl} alt={store.name} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-4xl">
                    🍽️
                  </div>
                )}
              </div>

              <div className="px-5 py-4">
                <div className="text-xl font-black text-stone-700">{store.name}</div>
                <div className="mt-1 text-sm font-bold text-stone-400">
                  {store.subtitle}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}