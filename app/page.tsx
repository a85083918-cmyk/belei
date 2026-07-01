"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import FixedImageRankCard from "./components/home/FixedImageRankCard";
import HeroSearch from "./components/home/HeroSearch";
import HomeCard from "./components/home/HomeCard";
import MobileHotList from "./components/home/MobileHotList";

import {
  expectationGap,
  hotSearches,
  stableStores,
  type StoreItem,
} from "./components/home/homeData";

import {
  isIntentSearch,
  normalizeSearchKeyword,
  normalizeStores,
} from "./components/home/homeUtils";

type LocationStatus = "idle" | "loading" | "granted" | "denied";

export default function Home() {
  const router = useRouter();
  const recentRef = useRef<HTMLDivElement>(null);

  const [keyword, setKeyword] = useState("");
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [showRecent, setShowRecent] = useState(false);

  const [currentCity, setCurrentCity] = useState("高雄");
  const [currentLat, setCurrentLat] = useState<number | null>(null);
  const [currentLng, setCurrentLng] = useState<number | null>(null);
  const [locationStatus, setLocationStatus] = useState<LocationStatus>("idle");

  const [hotStores, setHotStores] = useState<StoreItem[]>(hotSearches);
  const [gapStores, setGapStores] = useState<StoreItem[]>(expectationGap);
  const [stableStoreList, setStableStoreList] =
    useState<StoreItem[]>(stableStores);

  useEffect(() => {
    loadHomeRankings();

    const savedLocation = localStorage.getItem("belei-location");
    if (savedLocation) {
      try {
        const parsed = JSON.parse(savedLocation);
        if (parsed.lat && parsed.lng) {
          setCurrentLat(parsed.lat);
          setCurrentLng(parsed.lng);
          setLocationStatus("granted");
        }
        if (parsed.city) setCurrentCity(parsed.city);
      } catch {
        localStorage.removeItem("belei-location");
      }
    }

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

      setHotStores(hot.length ? hot : hotSearches);
      setGapStores(gap.length ? gap : expectationGap);
      setStableStoreList(stable.length ? stable : stableStores);
    } catch (error) {
      console.error("首頁排行榜載入失敗，改用預設資料", error);
      setHotStores(hotSearches);
      setGapStores(expectationGap);
      setStableStoreList(stableStores);
    }
  }

  function handleDetectLocation() {
    if (!("geolocation" in navigator)) {
      setLocationStatus("denied");
      return;
    }

    setLocationStatus("loading");

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;

        setCurrentLat(lat);
        setCurrentLng(lng);
        setLocationStatus("granted");

        localStorage.setItem(
          "belei-location",
          JSON.stringify({
            city: currentCity,
            lat,
            lng,
          })
        );
      },
      () => {
        setLocationStatus("denied");
      },
      {
        enableHighAccuracy: true,
        timeout: 8000,
        maximumAge: 1000 * 60 * 10,
      }
    );
  }

  function saveRecentSearch(searchKeyword: string) {
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
  }

  function getIntentSearchUrl(searchKeyword: string) {
    const params = new URLSearchParams();
    params.set("q", searchKeyword);
    params.set("city", currentCity);

    if (currentLat && currentLng) {
      params.set("lat", String(currentLat));
      params.set("lng", String(currentLng));
    }

    return `/intent-search?${params.toString()}`;
  }

  function handleSearch(value?: string) {
    const searchKeyword = normalizeSearchKeyword(value || keyword);
    if (!searchKeyword) return;

    saveRecentSearch(searchKeyword);

    if (isIntentSearch(searchKeyword)) {
      router.push(getIntentSearchUrl(searchKeyword));
      return;
    }

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

        <div className="relative mx-auto flex min-h-[360px] max-w-5xl flex-col px-4 pb-10 pt-6 text-white md:min-h-[560px]">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-black tracking-tight md:text-6xl">
              Be<span className="text-orange-500">Lei</span>
            </h1>
            <div className="text-2xl">🔔</div>
          </div>

          <div className="mt-10 text-center md:mt-20">
            <div className="mx-auto w-fit rounded-full bg-white/15 px-5 py-2 text-sm font-black text-orange-200 backdrop-blur">
              吃飯前先避雷
            </div>

            <h2 className="mt-4 text-5xl font-black leading-tight md:text-7xl">
              今天想吃
              <br />
              <span className="text-orange-400">什麼？</span>
            </h2>

            <p className="mt-3 text-base font-bold leading-7 text-white/90 md:text-2xl">
              可以直接查餐廳
              <br />
              也可以像問 AI 一樣描述需求
            </p>
          </div>

          <HeroSearch
            keyword={keyword}
            setKeyword={setKeyword}
            recentSearches={recentSearches}
            showRecent={showRecent}
            setShowRecent={setShowRecent}
            handleSearch={handleSearch}
            clearRecentSearches={clearRecentSearches}
            recentRef={recentRef}
            currentCity={currentCity}
            locationStatus={locationStatus}
            onDetectLocation={handleDetectLocation}
          />

          <div className="mx-auto mt-5 grid w-full max-w-3xl grid-cols-1 gap-3 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => router.push("/nearby")}
              className="rounded-[22px] border border-white/25 bg-white/15 px-5 py-4 text-left backdrop-blur transition hover:bg-white/25"
            >
              <div className="text-lg font-black">📍 附近避雷</div>
              <div className="mt-1 text-sm font-bold text-white/75">
                打開定位，查看附近餐廳風險
              </div>
            </button>

            <button
              type="button"
              onClick={() => router.push("/travel")}
              className="rounded-[22px] border border-orange-300/40 bg-orange-500/20 px-5 py-4 text-left backdrop-blur transition hover:bg-orange-500/30"
            >
              <div className="text-lg font-black">🌍 旅人避雷</div>
              <div className="mt-1 text-sm font-bold text-white/75">
                出國看不懂評價，也能查中文報告
              </div>
            </button>
          </div>
        </div>
      </section>

      <section className="mx-auto -mt-4 flex max-w-5xl flex-col px-4 pb-10 md:mt-10">
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