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
  { name: "老新台菜", query: "老新台菜 高雄", subtitle: "高雄・中式料理" },
  { name: "丹丹漢堡", query: "丹丹漢堡 高雄", subtitle: "高雄・速食" },
  { name: "旭集", query: "旭集 高雄", subtitle: "高雄・吃到飽" },
  { name: "鴨肉珍", query: "鴨肉珍 高雄", subtitle: "高雄・小吃" },
];

const expectationGap: StoreItem[] = [
  { name: "瓦城泰國料理", query: "瓦城泰國料理 高雄", subtitle: "高雄・泰式料理" },
  { name: "森森燒肉", query: "森森燒肉 高雄", subtitle: "高雄・燒肉" },
  { name: "旭集", query: "旭集 高雄", subtitle: "高雄・吃到飽" },
];

const stableStores: StoreItem[] = [
  { name: "老新台菜", query: "老新台菜 高雄", subtitle: "高雄・中式料理" },
  { name: "丹丹漢堡", query: "丹丹漢堡 高雄", subtitle: "高雄・速食" },
  { name: "鴨肉珍", query: "鴨肉珍 高雄", subtitle: "高雄・小吃" },
];

function normalizeStores(items?: ApiStoreItem[]): StoreItem[] {
  if (!items || !Array.isArray(items)) return [];

  return items.map((item) => ({
    name: item.name,
    query: item.query,
    subtitle: item.subtitle || item.area || "高雄・餐廳",
    photoName: item.photoName ?? null,
  }));
}

function normalizeSearchKeyword(value: string) {
  return value.replace(/\s+/g, " ").trim();
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
      if (
        recentRef.current &&
        !recentRef.current.contains(event.target as Node)
      ) {
        setShowRecent(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  async function loadHomeRankings() {
    try {
      const res = await fetch("/api/home-rankings", {
        cache: "no-store",
      });

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
          const res = await fetch(
            `/api/search?q=${encodeURIComponent(store.query)}`
          );
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
    <main className="min-h-screen bg-[#fff8e8] px-4 py-6 text-stone-950">
      <section className="mx-auto flex max-w-5xl flex-col items-center text-center">
        <div className="rounded-full bg-orange-100 px-5 py-2 text-sm font-black text-orange-600">
          吃之前，先避雷
        </div>

        <h1 className="mt-5 text-6xl font-black tracking-tight md:text-7xl">
          Be<span className="text-orange-500">Lei</span>
        </h1>

        <p className="mt-5 text-xl font-bold leading-9 text-stone-700 md:text-2xl">
          Google 告訴你有多紅
          <br />
          我們告訴你會不會後悔
        </p>

        <div
          ref={recentRef}
          className="relative mt-8 w-full max-w-2xl rounded-[30px] border border-stone-100 bg-white p-3 shadow-[6px_6px_0_#ead8b5]"
        >
          <div className="flex flex-col gap-3 sm:flex-row">
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
              className="flex-1 rounded-2xl bg-stone-50 px-5 py-4 text-lg font-bold outline-none focus:bg-orange-50"
            />

            <button
              onClick={() => handleSearch()}
              className="rounded-2xl bg-orange-500 px-8 py-4 text-lg font-black text-white hover:bg-orange-600"
            >
              開始避雷
            </button>
          </div>

          {showRecent && recentSearches.length > 0 && (
            <div className="absolute left-0 right-0 top-full z-30 mt-3 overflow-hidden rounded-[24px] border border-stone-100 bg-white text-left shadow-[6px_6px_0_#ead8b5]">
              <div className="flex items-center justify-between px-5 py-4">
                <div className="text-sm font-black text-stone-500">
                  🕒 最近搜尋
                </div>

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

        <section className="mt-10 w-full space-y-5 md:hidden">
          <MobileRankSection
            title="🔥 熱門搜尋"
            subtitle="大家最近正在查的餐廳"
            stores={hotStores}
            onSearch={handleSearch}
          />

          <MobileRankSection
            title="💥 本週期待落差最高"
            subtitle="Google 高分，但 BeLei 可能提醒你小心"
            stores={gapStores}
            onSearch={handleSearch}
          />

          <MobileRankSection
            title="⭐ 本週最穩定"
            subtitle="近期評論穩定，踩雷風險較低"
            stores={stableStoreList}
            onSearch={handleSearch}
          />
        </section>

        <section className="mt-14 hidden w-full gap-6 md:grid md:grid-cols-3">
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

function getPhotoUrl(photoName?: string | null) {
  if (!photoName) return null;
  return `/api/photo?name=${encodeURIComponent(photoName)}`;
}

function MobileRankSection({
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
    <div className="rounded-[26px] border border-stone-200 bg-white/90 p-5 text-left shadow-[5px_5px_0_#ead8b5]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-2xl font-black">{title}</h2>
          <p className="mt-1 text-sm font-bold text-stone-500">{subtitle}</p>
        </div>

        <button className="shrink-0 text-sm font-black text-orange-500">
          查看更多 ›
        </button>
      </div>

      <div className="mt-5 flex gap-3 overflow-x-auto pb-2">
        {stores.slice(0, 3).map((store, index) => {
          const photoUrl = getPhotoUrl(store.photoName);

          return (
            <button
              key={store.query}
              onClick={() => onSearch(store.query)}
              className="min-w-[145px] rounded-2xl border border-stone-100 bg-stone-50 p-3 text-left shadow-sm"
            >
              <div className="relative h-24 w-full overflow-hidden rounded-xl bg-stone-200">
                {photoUrl ? (
                  <img
                    src={photoUrl}
                    alt={store.name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-3xl">
                    🍽️
                  </div>
                )}

                <div className="absolute left-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-orange-500 text-sm font-black text-white">
                  {index + 1}
                </div>
              </div>

              <div className="mt-3 text-lg font-black text-stone-800">
                {store.name}
              </div>

              <div className="mt-1 text-xs font-bold text-stone-400">
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
                  <img
                    src={photoUrl}
                    alt={store.name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-4xl">
                    🍽️
                  </div>
                )}
              </div>

              <div className="px-5 py-4">
                <div className="text-xl font-black text-stone-700">
                  {store.name}
                </div>
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