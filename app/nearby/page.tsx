"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";

const NearbyMap = dynamic(() => import("../components/NearbyMap"), {
  ssr: false,
});

type LocationState = {
  latitude: number;
  longitude: number;
};

type NearbyPlace = {
  placeId: string;
  name: string;
  address: string;
  rating: number | null;
  userRatingCount: number;
  openNow: boolean | null;
  latitude: number | null;
  longitude: number | null;
  distance: number | null;
  photoName?: string | null;
};

type FilterMode = "open" | "closed" | "all";
type SortMode = "distance" | "rating" | "reviews" | "risk";
type CategoryMode =
  | "all"
  | "restaurant"
  | "cafe"
  | "dessert"
  | "bar"
  | "takeaway";

function getPhotoUrl(photoName?: string | null) {
  if (!photoName) return null;
  return `/api/photo?name=${encodeURIComponent(photoName)}&w=500`;
}

function getWalkMinutes(distance: number | null) {
  if (distance === null) return null;
  return Math.max(1, Math.ceil(distance / 80));
}

function getSimpleRiskScore(place: NearbyPlace) {
  let score = 50;

  if ((place.rating ?? 0) >= 4.6) score -= 15;
  else if ((place.rating ?? 0) >= 4.3) score -= 8;
  else if ((place.rating ?? 0) < 3.8) score += 18;
  else if ((place.rating ?? 0) < 4.1) score += 8;

  if (place.userRatingCount >= 1000) score -= 8;
  else if (place.userRatingCount >= 300) score -= 5;
  else if (place.userRatingCount < 30) score += 12;
  else if (place.userRatingCount < 100) score += 6;

  return Math.max(0, Math.min(score, 100));
}

function getRiskBombs(place: NearbyPlace) {
  const score = getSimpleRiskScore(place);
  if (score <= 25) return "💥";
  if (score <= 40) return "💥💥";
  if (score <= 55) return "💥💥💥";
  if (score <= 70) return "💥💥💥💥";
  return "💥💥💥💥💥";
}

export default function NearbyPage() {
  const router = useRouter();

  const [location, setLocation] = useState<LocationState | null>(null);
  const [places, setPlaces] = useState<NearbyPlace[]>([]);
  const [filterMode, setFilterMode] = useState<FilterMode>("open");
  const [sortMode, setSortMode] = useState<SortMode>("distance");
  const [categoryMode, setCategoryMode] = useState<CategoryMode>("all");
  const [viewMode, setViewMode] = useState<"list" | "map">("list");
  const [selectedMapPlace, setSelectedMapPlace] = useState<NearbyPlace | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [savedPlaceIds, setSavedPlaceIds] = useState<string[]>([]);

  const openPlaces = useMemo(
    () => places.filter((place) => place.openNow === true),
    [places]
  );

  const closedPlaces = useMemo(
    () => places.filter((place) => place.openNow === false),
    [places]
  );

  const filteredPlaces = useMemo(() => {
    let list: NearbyPlace[] = [];

    if (filterMode === "open") list = [...openPlaces];
    else if (filterMode === "closed") list = [...closedPlaces];
    else list = [...places];

    switch (sortMode) {
      case "rating":
        list.sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));
        break;
      case "reviews":
        list.sort((a, b) => b.userRatingCount - a.userRatingCount);
        break;
      case "risk":
        list.sort((a, b) => getSimpleRiskScore(b) - getSimpleRiskScore(a));
        break;
      case "distance":
      default:
        list.sort((a, b) => (a.distance ?? 999999) - (b.distance ?? 999999));
        break;
    }

    return list;
  }, [filterMode, sortMode, places, openPlaces, closedPlaces]);

  function getCurrentLocation() {
    setErrorMessage("");
    setIsLoading(true);

    if (!navigator.geolocation) {
      setIsLoading(false);
      setErrorMessage("你的瀏覽器不支援定位功能，請改用 Chrome 或 Safari。");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const nextLocation = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        };

        setLocation(nextLocation);
        setIsLoading(false);
        await searchNearbyRestaurants(nextLocation);
      },
      (error) => {
        setIsLoading(false);

        if (error.code === error.PERMISSION_DENIED) {
          setErrorMessage("你拒絕了定位權限，請允許定位後再試一次。");
          return;
        }

        if (error.code === error.POSITION_UNAVAILABLE) {
          setErrorMessage("目前無法取得位置，請確認網路或 GPS 是否開啟。");
          return;
        }

        if (error.code === error.TIMEOUT) {
          setErrorMessage("定位逾時，請稍後再試一次。");
          return;
        }

        setErrorMessage("定位失敗，請稍後再試一次。");
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  }

  async function searchNearbyRestaurants(currentLocation: LocationState) {
    try {
      setIsSearching(true);
      setErrorMessage("");
      setSelectedMapPlace(null);

      const res = await fetch(
        `/api/nearby?lat=${currentLocation.latitude}&lng=${currentLocation.longitude}&category=${categoryMode}`,
        { cache: "no-store" }
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "附近餐廳搜尋失敗");
      }

      setPlaces(data.places || []);
      setFilterMode("all");
      setSortMode("distance");
      setViewMode("list");
    } catch (error) {
      console.error(error);
      setErrorMessage("附近餐廳搜尋失敗，請確認 Google Places API 設定是否正常。");
    } finally {
      setIsSearching(false);
    }
  }

  function openGoogleMaps(place: NearbyPlace) {
    if (place.latitude === null || place.longitude === null) return;

    window.open(
      `https://www.google.com/maps/search/?api=1&query=${place.latitude},${place.longitude}`,
      "_blank"
    );
  }

  function toggleSave(placeId: string) {
    alert("收藏功能將於會員系統上線後開放。");
    setSavedPlaceIds((prev) =>
      prev.includes(placeId)
        ? prev.filter((id) => id !== placeId)
        : [...prev, placeId]
    );
  }

  async function sharePlace(place: NearbyPlace) {
    const shareText = `📍 BeLei 附近避雷
店家：${place.name}
評分：${place.rating ?? "無評分"}★
評論數：${place.userRatingCount.toLocaleString()} 則
距離：約 ${place.distance ?? "-"}m
步行：約 ${getWalkMinutes(place.distance) ?? "-"} 分鐘
避雷風險：${getRiskBombs(place)}

${window.location.origin}/restaurant/${place.placeId}?source=nearby&distance=${place.distance ?? 0}`;

    try {
      await navigator.clipboard.writeText(shareText);
      alert("已複製分享內容");
    } catch {
      alert("分享複製失敗");
    }
  }

  function goReport(place: NearbyPlace) {
    router.push(
      `/restaurant/${place.placeId}?source=nearby&distance=${place.distance ?? 0}`
    );
  }

  return (
    <main className="min-h-screen bg-[#fff8e8] text-stone-950">
      <section className="relative overflow-hidden bg-stone-950 text-white">
        <div className="absolute inset-0 bg-gradient-to-b from-black via-stone-950 to-[#fff8e8]" />

        <div className="relative mx-auto max-w-5xl px-4 pb-12 pt-6">
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => router.push("/")}
              className="rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-black text-white backdrop-blur transition hover:bg-white/20"
            >
              ← 回首頁
            </button>

            <div className="rounded-full bg-orange-500/20 px-4 py-2 text-sm font-black text-orange-200">
              Nearby Beta
            </div>
          </div>

          <div className="mx-auto mt-14 max-w-3xl text-center">
            <div className="mx-auto w-fit rounded-full bg-white/15 px-5 py-2 text-sm font-black text-orange-200 backdrop-blur">
              📍 附近避雷
            </div>

            <h1 className="mt-5 text-5xl font-black leading-tight md:text-7xl">
              不知道附近
              <br />
              吃什麼？
            </h1>

            <p className="mx-auto mt-4 max-w-2xl text-base font-bold leading-7 text-white/80 md:text-xl">
              打開定位，BeLei 幫你找出附近餐飲店家，
              下一步會整理評論風險，降低踩雷機率。
            </p>

            <button
              type="button"
              onClick={getCurrentLocation}
              disabled={isLoading || isSearching}
              className="mt-8 rounded-[22px] bg-orange-500 px-8 py-5 text-lg font-black text-white shadow-[0_18px_40px_rgba(249,115,22,0.3)] transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:bg-stone-400"
            >
              {isLoading
                ? "正在取得位置..."
                : isSearching
                ? "正在搜尋附近餐廳..."
                : "使用目前位置"}
            </button>

            {errorMessage && (
              <div className="mx-auto mt-6 max-w-xl rounded-[22px] border border-red-200 bg-red-50 px-5 py-4 text-left text-sm font-bold leading-6 text-red-700">
                ⚠️ {errorMessage}
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-4 py-8">
        <div className="rounded-[28px] border border-stone-200 bg-white p-6 shadow-sm md:p-8">
          <div>
            <h2 className="text-2xl font-black">附近餐飲店家</h2>

            {location ? (
              <p className="mt-2 text-sm font-bold leading-6 text-stone-500">
                已取得定位，正在以你目前位置搜尋 800 公尺內的餐飲店家。
              </p>
            ) : (
              <p className="mt-2 text-sm font-bold leading-6 text-stone-500">
                請先點擊上方「使用目前位置」。
              </p>
            )}
          </div>

          {places.length > 0 && (
            <div className="mt-5 space-y-4">
              <div className="grid grid-cols-3 rounded-[18px] bg-stone-100 p-1 text-xs font-black md:max-w-xl md:text-sm">
                <button
                  type="button"
                  onClick={() => {
                    setFilterMode("open");
                    setSelectedMapPlace(null);
                  }}
                  className={`rounded-[14px] px-3 py-3 transition ${
                    filterMode === "open"
                      ? "bg-green-600 text-white shadow-sm"
                      : "text-stone-500 hover:bg-white"
                  }`}
                >
                  🟢 營業中 ({openPlaces.length})
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setFilterMode("closed");
                    setSelectedMapPlace(null);
                  }}
                  className={`rounded-[14px] px-3 py-3 transition ${
                    filterMode === "closed"
                      ? "bg-stone-800 text-white shadow-sm"
                      : "text-stone-500 hover:bg-white"
                  }`}
                >
                  ⚫ 已休息 ({closedPlaces.length})
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setFilterMode("all");
                    setSelectedMapPlace(null);
                  }}
                  className={`rounded-[14px] px-3 py-3 transition ${
                    filterMode === "all"
                      ? "bg-orange-500 text-white shadow-sm"
                      : "text-stone-500 hover:bg-white"
                  }`}
                >
                  🍽 全部 ({places.length})
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
  <CategoryButton
    active={categoryMode === "all"}
    onClick={() => {
      setCategoryMode("all");
      location && searchNearbyRestaurants(location);
    }}
  >
    🍽 全部
  </CategoryButton>

  <CategoryButton
    active={categoryMode === "restaurant"}
    onClick={() => {
      setCategoryMode("restaurant");
      location && searchNearbyRestaurants(location);
    }}
  >
    🍜 餐廳
  </CategoryButton>

  <CategoryButton
    active={categoryMode === "cafe"}
    onClick={() => {
      setCategoryMode("cafe");
      location && searchNearbyRestaurants(location);
    }}
  >
    ☕ 咖啡
  </CategoryButton>

  <CategoryButton
    active={categoryMode === "dessert"}
    onClick={() => {
      setCategoryMode("dessert");
      location && searchNearbyRestaurants(location);
    }}
  >
    🍰 甜點
  </CategoryButton>

  <CategoryButton
    active={categoryMode === "bar"}
    onClick={() => {
      setCategoryMode("bar");
      location && searchNearbyRestaurants(location);
    }}
  >
    🍺 酒吧
  </CategoryButton>

  <CategoryButton
    active={categoryMode === "takeaway"}
    onClick={() => {
      setCategoryMode("takeaway");
      location && searchNearbyRestaurants(location);
    }}
  >
    🍱 外帶
  </CategoryButton>
</div>

              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setViewMode("list")}
                  className={`rounded-full px-5 py-2 text-sm font-black transition ${
                    viewMode === "list"
                      ? "bg-stone-900 text-white"
                      : "bg-stone-100 text-stone-600 hover:bg-stone-200"
                  }`}
                >
                  📋 清單模式
                </button>

                <button
                  type="button"
                  onClick={() => setViewMode("map")}
                  className={`rounded-full px-5 py-2 text-sm font-black transition ${
                    viewMode === "map"
                      ? "bg-orange-500 text-white"
                      : "bg-stone-100 text-stone-600 hover:bg-stone-200"
                  }`}
                >
                  🗺 地圖模式
                </button>
              </div>

              <div className="flex flex-wrap gap-2">
                <SortButton active={sortMode === "distance"} onClick={() => setSortMode("distance")}>
                  📍 最近距離
                </SortButton>

                <SortButton active={sortMode === "rating"} onClick={() => setSortMode("rating")}>
                  ⭐ 最高評分
                </SortButton>

                <SortButton active={sortMode === "reviews"} onClick={() => setSortMode("reviews")}>
                  🔥 討論度
                </SortButton>

                <SortButton active={sortMode === "risk"} onClick={() => setSortMode("risk")}>
                  💥 BeLei風險
                </SortButton>
              </div>
            </div>
          )}

          {location && (
            <div className="mt-5 rounded-[22px] bg-orange-50 p-4 text-sm font-bold text-stone-600">
              📍 Latitude：{location.latitude}
              <br />
              📍 Longitude：{location.longitude}
            </div>
          )}

          {isSearching && (
            <div className="mt-6 rounded-[24px] bg-stone-50 p-5 text-sm font-bold leading-6 text-stone-500">
              正在搜尋附近餐廳...
            </div>
          )}

          {!isSearching &&
            location &&
            filteredPlaces.length > 0 &&
            viewMode === "map" && (
              <div className="mt-6 space-y-4">
                <div className="overflow-hidden rounded-[28px] border border-stone-200">
                <NearbyMap
  center={{
    lat: location.latitude,
    lng: location.longitude,
  }}
  places={filteredPlaces}
  onSelectPlace={(place) => {
    setSelectedMapPlace(place);
  }}
  onSearchArea={async (nextCenter) => {
    try {
      setIsSearching(true);
      setSelectedMapPlace(null);

      const res = await fetch(
        `/api/nearby?lat=${nextCenter.lat}&lng=${nextCenter.lng}&category=${categoryMode}`,
        {
          cache: "no-store",
        }
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(
          data.error || "搜尋此區域失敗"
        );
      }

      setPlaces(data.places || []);

      setLocation({
        latitude: nextCenter.lat,
        longitude: nextCenter.lng,
      });

      setFilterMode("all");
    } catch (error) {
      console.error(error);
      alert("搜尋此區域失敗");
    } finally {
      setIsSearching(false);
    }
  }}
/>
                </div>

                {selectedMapPlace && (
                  <MapPlaceCard
                    place={selectedMapPlace}
                    onClose={() => setSelectedMapPlace(null)}
                    onReport={() => goReport(selectedMapPlace)}
                    onNavigate={() => openGoogleMaps(selectedMapPlace)}
                    onShare={() => sharePlace(selectedMapPlace)}
                  />
                )}
              </div>
            )}

          {!isSearching &&
            filteredPlaces.length > 0 &&
            viewMode === "list" && (
              <div className="mt-6 grid gap-4 md:grid-cols-2">
                {filteredPlaces.map((place) => {
                  const photoUrl = getPhotoUrl(place.photoName);
                  const walkMinutes = getWalkMinutes(place.distance);
                  const isSaved = savedPlaceIds.includes(place.placeId);

                  return (
                    <div
                      key={place.placeId}
                      className="overflow-hidden rounded-[26px] border border-stone-200 bg-stone-50 text-left transition hover:-translate-y-1 hover:bg-orange-50 hover:shadow-md"
                    >
                      <div className="h-40 w-full bg-stone-200">
                        {photoUrl ? (
                          <img
                            src={photoUrl}
                            alt={place.name}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-full items-center justify-center text-4xl">
                            餐
                          </div>
                        )}
                      </div>

                      <div className="p-5">
                        <div className="flex items-start justify-between gap-3">
                          <h3 className="text-xl font-black text-stone-900">
                            {place.name}
                          </h3>

                          {place.openNow !== null && (
                            <span
                              className={`shrink-0 rounded-full px-3 py-1 text-xs font-black ${
                                place.openNow
                                  ? "bg-green-100 text-green-700"
                                  : "bg-stone-200 text-stone-600"
                              }`}
                            >
                              {place.openNow ? "營業中" : "已休息"}
                            </span>
                          )}
                        </div>

                        <p className="mt-2 line-clamp-2 text-sm font-bold leading-6 text-stone-500">
                          {place.address || "尚無地址資料"}
                        </p>

                        <PlaceMeta place={place} />

                        <div className="mt-5 grid grid-cols-2 gap-3">
                          <button
                            type="button"
                            onClick={() => goReport(place)}
                            className="rounded-2xl bg-stone-900 px-4 py-3 text-center text-sm font-black text-white transition hover:bg-stone-800"
                          >
                            💥 AI避雷報告
                          </button>

                          <button
                            type="button"
                            onClick={() => openGoogleMaps(place)}
                            className="rounded-2xl border border-stone-300 bg-white px-4 py-3 text-center text-sm font-black text-stone-700 transition hover:bg-stone-100"
                          >
                            🗺 導航
                          </button>

                          <button
                            type="button"
                            onClick={() => toggleSave(place.placeId)}
                            className={`rounded-2xl border px-4 py-3 text-center text-sm font-black transition ${
                              isSaved
                                ? "border-red-200 bg-red-50 text-red-600"
                                : "border-stone-300 bg-white text-stone-700 hover:bg-stone-100"
                            }`}
                          >
                            {isSaved ? "❤️ 已收藏" : "🤍 收藏"}
                          </button>

                          <button
                            type="button"
                            onClick={() => sharePlace(place)}
                            className="rounded-2xl border border-stone-300 bg-white px-4 py-3 text-center text-sm font-black text-stone-700 transition hover:bg-stone-100"
                          >
                            📤 分享
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

          {!isSearching &&
            location &&
            places.length > 0 &&
            filteredPlaces.length === 0 && (
              <div className="mt-6 rounded-[24px] bg-stone-50 p-5 text-sm font-bold leading-6 text-stone-500">
                這個分類目前沒有店家，請切換「全部」查看。
              </div>
            )}

          {!isSearching && location && places.length === 0 && !errorMessage && (
            <div className="mt-6 rounded-[24px] bg-stone-50 p-5 text-sm font-bold leading-6 text-stone-500">
              目前附近沒有找到符合條件的餐飲店家。
            </div>
          )}
        </div>
      </section>
    </main>
  );
}

function PlaceMeta({ place }: { place: NearbyPlace }) {
  const walkMinutes = getWalkMinutes(place.distance);

  return (
    <div className="mt-4 flex flex-wrap gap-2 text-sm font-black">
      <span className="rounded-full bg-white px-3 py-2 text-orange-600">
        ⭐ {place.rating ?? "無評分"}
      </span>

      <span className="rounded-full bg-white px-3 py-2 text-stone-600">
        {place.userRatingCount.toLocaleString()} 則評論
      </span>

      {place.distance !== null && (
        <span className="rounded-full bg-white px-3 py-2 text-stone-600">
          📍 {place.distance}m
        </span>
      )}

      {walkMinutes !== null && (
        <span className="rounded-full bg-white px-3 py-2 text-stone-600">
          🚶 約 {walkMinutes} 分鐘
        </span>
      )}

      <span className="rounded-full bg-white px-3 py-2 text-orange-600">
        {getRiskBombs(place)}
      </span>
    </div>
  );
}

function MapPlaceCard({
  place,
  onClose,
  onReport,
  onNavigate,
  onShare,
}: {
  place: NearbyPlace;
  onClose: () => void;
  onReport: () => void;
  onNavigate: () => void;
  onShare: () => void;
}) {
  return (
    <div className="rounded-[26px] border border-orange-200 bg-orange-50 p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-xs font-black text-orange-600">
            🗺 地圖選取店家
          </div>

          <h3 className="mt-2 text-2xl font-black text-stone-900">
            {place.name}
          </h3>

          <div className="mt-2">
            {place.openNow !== null && (
              <span
                className={`rounded-full px-3 py-1 text-xs font-black ${
                  place.openNow
                    ? "bg-green-100 text-green-700"
                    : "bg-stone-200 text-stone-600"
                }`}
              >
                {place.openNow ? "營業中" : "已休息"}
              </span>
            )}
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="rounded-full bg-white px-3 py-2 text-sm font-black text-stone-500"
        >
          ✕
        </button>
      </div>

      <PlaceMeta place={place} />

      <div className="mt-5 grid grid-cols-3 gap-3">
        <button
          type="button"
          onClick={onReport}
          className="rounded-2xl bg-stone-900 px-4 py-3 text-center text-sm font-black text-white transition hover:bg-stone-800"
        >
          💥 AI報告
        </button>

        <button
          type="button"
          onClick={onNavigate}
          className="rounded-2xl border border-stone-300 bg-white px-4 py-3 text-center text-sm font-black text-stone-700 transition hover:bg-stone-100"
        >
          🗺 導航
        </button>

        <button
          type="button"
          onClick={onShare}
          className="rounded-2xl border border-stone-300 bg-white px-4 py-3 text-center text-sm font-black text-stone-700 transition hover:bg-stone-100"
        >
          📤 分享
        </button>
      </div>
    </div>
  );
}

function SortButton({
    active,
    onClick,
    children,
  }: {
    active: boolean;
    onClick: () => void;
    children: React.ReactNode;
  }) {
    return (
      <button
        type="button"
        onClick={onClick}
        className={`rounded-full px-4 py-2 text-sm font-black transition ${
          active ? "bg-orange-500 text-white" : "bg-stone-100 text-stone-600"
        }`}
      >
        {children}
      </button>
    );
  }
  
  function CategoryButton({
    active,
    onClick,
    children,
  }: {
    active: boolean;
    onClick: () => void;
    children: React.ReactNode;
  }) {
    return (
      <button
        type="button"
        onClick={onClick}
        className={`rounded-full px-4 py-2 text-sm font-black transition ${
          active
            ? "bg-stone-900 text-white"
            : "bg-stone-100 text-stone-600 hover:bg-stone-200"
        }`}
      >
        {children}
      </button>
    );
  }