"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";

const NearbyMap = dynamic(() => import("../components/NearbyMap"), {
  ssr: false,
});

const ITEMS_PER_PAGE = 10;

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
type CategoryMode = "all" | "restaurant" | "cafe" | "dessert" | "bar" | "takeaway";

type SubCategory = {
  id: string;
  label: string;
  apiCategory: CategoryMode;
  keyword?: string;
};

type MainCategory = {
  id: string;
  label: string;
  apiCategory: CategoryMode;
  children: SubCategory[];
};

const CATEGORY_GROUPS: MainCategory[] = [
  {
    id: "all",
    label: "🍽 全部",
    apiCategory: "all",
    children: [{ id: "all", label: "全部店家", apiCategory: "all" }],
  },
  {
    id: "bbq",
    label: "🍖 燒烤",
    apiCategory: "restaurant",
    children: [
      { id: "bbq_all", label: "全部燒烤", apiCategory: "restaurant", keyword: "燒烤" },
      { id: "yakiniku", label: "燒肉", apiCategory: "restaurant", keyword: "燒肉" },
      { id: "korean_bbq", label: "韓式烤肉", apiCategory: "restaurant", keyword: "韓式烤肉" },
      { id: "yakitori", label: "串燒", apiCategory: "restaurant", keyword: "串燒" },
      { id: "izakaya", label: "居酒屋", apiCategory: "restaurant", keyword: "居酒屋" },
      { id: "charcoal", label: "炭烤 / BBQ", apiCategory: "restaurant", keyword: "炭烤 BBQ" },
    ],
  },
  {
    id: "hotpot",
    label: "🍲 火鍋",
    apiCategory: "restaurant",
    children: [
      { id: "hotpot_all", label: "全部火鍋", apiCategory: "restaurant", keyword: "火鍋" },
      { id: "personal_hotpot", label: "個人鍋", apiCategory: "restaurant", keyword: "個人鍋" },
      { id: "spicy_hotpot", label: "麻辣鍋", apiCategory: "restaurant", keyword: "麻辣鍋" },
      { id: "buffet_hotpot", label: "火鍋吃到飽", apiCategory: "restaurant", keyword: "火鍋吃到飽" },
      { id: "stone_hotpot", label: "石頭火鍋", apiCategory: "restaurant", keyword: "石頭火鍋" },
      { id: "shabu", label: "涮涮鍋", apiCategory: "restaurant", keyword: "涮涮鍋" },
    ],
  },
  {
    id: "japanese",
    label: "🍣 日式",
    apiCategory: "restaurant",
    children: [
      { id: "japanese_all", label: "全部日式", apiCategory: "restaurant", keyword: "日式料理" },
      { id: "sushi", label: "壽司", apiCategory: "restaurant", keyword: "壽司" },
      { id: "ramen", label: "拉麵", apiCategory: "restaurant", keyword: "拉麵" },
      { id: "donburi", label: "丼飯", apiCategory: "restaurant", keyword: "丼飯" },
      { id: "teishoku", label: "定食", apiCategory: "restaurant", keyword: "定食" },
      { id: "japanese_buffet", label: "日料吃到飽", apiCategory: "restaurant", keyword: "日料吃到飽" },
    ],
  },
  {
    id: "chinese",
    label: "🍜 中式",
    apiCategory: "restaurant",
    children: [
      { id: "chinese_all", label: "全部中式", apiCategory: "restaurant", keyword: "中式料理" },
      { id: "taiwanese", label: "台菜", apiCategory: "restaurant", keyword: "台菜" },
      { id: "stir_fry", label: "熱炒", apiCategory: "restaurant", keyword: "熱炒" },
      { id: "sichuan", label: "川菜", apiCategory: "restaurant", keyword: "川菜" },
      { id: "hongkong", label: "港式", apiCategory: "restaurant", keyword: "港式" },
      { id: "noodles", label: "麵食", apiCategory: "restaurant", keyword: "麵食" },
      { id: "snack", label: "小吃", apiCategory: "restaurant", keyword: "小吃" },
    ],
  },
  {
    id: "steak",
    label: "🥩 牛排",
    apiCategory: "restaurant",
    children: [
      { id: "steak_all", label: "全部牛排", apiCategory: "restaurant", keyword: "牛排" },
      { id: "budget_steak", label: "平價牛排", apiCategory: "restaurant", keyword: "平價牛排" },
      { id: "steakhouse", label: "牛排館", apiCategory: "restaurant", keyword: "牛排館" },
      { id: "teppanyaki", label: "鐵板燒", apiCategory: "restaurant", keyword: "鐵板燒" },
      { id: "premium_steak", label: "高級排餐", apiCategory: "restaurant", keyword: "高級牛排" },
    ],
  },
  {
    id: "italian",
    label: "🍝 義式",
    apiCategory: "restaurant",
    children: [
      { id: "italian_all", label: "全部義式", apiCategory: "restaurant", keyword: "義式料理" },
      { id: "pasta", label: "義大利麵", apiCategory: "restaurant", keyword: "義大利麵" },
      { id: "risotto", label: "燉飯", apiCategory: "restaurant", keyword: "燉飯" },
      { id: "pizza", label: "披薩", apiCategory: "restaurant", keyword: "披薩" },
      { id: "bistro", label: "義式餐酒館", apiCategory: "restaurant", keyword: "義式餐酒館" },
    ],
  },
  {
    id: "international",
    label: "🌮 異國料理",
    apiCategory: "restaurant",
    children: [
      { id: "international_all", label: "全部異國料理", apiCategory: "restaurant", keyword: "異國料理" },
      { id: "korean", label: "韓式", apiCategory: "restaurant", keyword: "韓式料理" },
      { id: "thai", label: "泰式", apiCategory: "restaurant", keyword: "泰式料理" },
      { id: "vietnamese", label: "越式", apiCategory: "restaurant", keyword: "越式料理" },
      { id: "indian", label: "印度", apiCategory: "restaurant", keyword: "印度料理" },
      { id: "mexican", label: "墨西哥", apiCategory: "restaurant", keyword: "墨西哥料理" },
      { id: "malaysia", label: "馬來西亞 / 新加坡", apiCategory: "restaurant", keyword: "馬來西亞 新加坡料理" },
    ],
  },
  {
    id: "cafe",
    label: "☕ 咖啡廳",
    apiCategory: "cafe",
    children: [
      { id: "cafe_all", label: "全部咖啡廳", apiCategory: "cafe", keyword: "咖啡廳" },
      { id: "specialty_coffee", label: "精品咖啡", apiCategory: "cafe", keyword: "精品咖啡" },
      { id: "hand_drip", label: "手沖咖啡", apiCategory: "cafe", keyword: "手沖咖啡" },
      { id: "chain_cafe", label: "連鎖咖啡", apiCategory: "cafe", keyword: "連鎖咖啡" },
      { id: "aesthetic_cafe", label: "網美咖啡廳", apiCategory: "cafe", keyword: "網美咖啡廳" },
    ],
  },
  {
    id: "dessert",
    label: "🍰 甜點",
    apiCategory: "dessert",
    children: [
      { id: "dessert_all", label: "全部甜點", apiCategory: "dessert", keyword: "甜點" },
      { id: "cake", label: "蛋糕", apiCategory: "dessert", keyword: "蛋糕" },
      { id: "ice", label: "冰品", apiCategory: "dessert", keyword: "冰品" },
      { id: "tofu_pudding", label: "豆花", apiCategory: "dessert", keyword: "豆花" },
      { id: "pancake", label: "鬆餅", apiCategory: "dessert", keyword: "鬆餅" },
      { id: "sweet_soup", label: "甜湯", apiCategory: "dessert", keyword: "甜湯" },
    ],
  },
  {
    id: "bar",
    label: "🍺 酒吧",
    apiCategory: "bar",
    children: [
      { id: "bar_all", label: "全部酒吧", apiCategory: "bar", keyword: "酒吧" },
      { id: "cocktail", label: "調酒吧", apiCategory: "bar", keyword: "調酒吧" },
      { id: "beer", label: "精釀啤酒", apiCategory: "bar", keyword: "精釀啤酒" },
      { id: "wine_bar", label: "餐酒館", apiCategory: "bar", keyword: "餐酒館" },
      { id: "sports_bar", label: "運動酒吧", apiCategory: "bar", keyword: "運動酒吧" },
    ],
  },
  {
    id: "american",
    label: "🍔 美式",
    apiCategory: "restaurant",
    children: [
      { id: "american_all", label: "全部美式", apiCategory: "restaurant", keyword: "美式餐廳" },
      { id: "burger", label: "漢堡", apiCategory: "restaurant", keyword: "漢堡" },
      { id: "fried_chicken", label: "炸雞", apiCategory: "restaurant", keyword: "炸雞" },
      { id: "fast_food", label: "速食", apiCategory: "restaurant", keyword: "速食" },
      { id: "american_restaurant", label: "美式餐廳", apiCategory: "restaurant", keyword: "美式餐廳" },
    ],
  },
  {
    id: "brunch",
    label: "🥪 早午餐",
    apiCategory: "restaurant",
    children: [
      { id: "brunch_all", label: "全部早午餐", apiCategory: "restaurant", keyword: "早午餐" },
      { id: "breakfast", label: "早餐店", apiCategory: "restaurant", keyword: "早餐店" },
      { id: "brunch_shop", label: "Brunch", apiCategory: "restaurant", keyword: "Brunch" },
      { id: "sandwich", label: "三明治", apiCategory: "restaurant", keyword: "三明治" },
      { id: "light_meal", label: "輕食", apiCategory: "restaurant", keyword: "輕食" },
    ],
  },
];

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
  const [filterMode, setFilterMode] = useState<FilterMode>("all");
  const [sortMode, setSortMode] = useState<SortMode>("distance");
  const [categoryMode, setCategoryMode] = useState<CategoryMode>("all");
  const [activeMainCategoryId, setActiveMainCategoryId] = useState("all");
  const [activeSubCategoryId, setActiveSubCategoryId] = useState("all");
  const [activeKeyword, setActiveKeyword] = useState("");
  const [selectedMapPlace, setSelectedMapPlace] = useState<NearbyPlace | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [savedPlaceIds, setSavedPlaceIds] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);

  const activeMainCategory =
    CATEGORY_GROUPS.find((category) => category.id === activeMainCategoryId) ||
    CATEGORY_GROUPS[0];

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

  const totalPages = Math.max(1, Math.ceil(filteredPlaces.length / ITEMS_PER_PAGE));

  const pagedPlaces = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredPlaces.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredPlaces, currentPage]);

  function buildNearbyUrl(
    currentLocation: LocationState,
    nextCategoryMode: CategoryMode,
    keyword = ""
  ) {
    const params = new URLSearchParams({
      lat: String(currentLocation.latitude),
      lng: String(currentLocation.longitude),
      category: nextCategoryMode,
    });

    if (keyword.trim()) {
      params.set("keyword", keyword.trim());
    }

    return `/api/nearby?${params.toString()}`;
  }

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
        await searchNearbyRestaurants(nextLocation, categoryMode, activeKeyword);
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

  async function searchNearbyRestaurants(
    currentLocation: LocationState,
    nextCategoryMode: CategoryMode = categoryMode,
    keyword = activeKeyword
  ) {
    try {
      setIsSearching(true);
      setErrorMessage("");
      setSelectedMapPlace(null);

      const res = await fetch(buildNearbyUrl(currentLocation, nextCategoryMode, keyword), {
        cache: "no-store",
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "附近餐廳搜尋失敗");
      }

      setPlaces(data.places || []);
      setCurrentPage(1);
      setFilterMode("all");
      setSortMode("distance");
    } catch (error) {
      console.error(error);
      setErrorMessage("附近餐廳搜尋失敗，請確認 Google Places API 設定是否正常。");
    } finally {
      setIsSearching(false);
    }
  }

  async function handleMainCategoryClick(category: MainCategory) {
    const firstChild = category.children[0];
    const nextKeyword = firstChild.keyword || "";

    setActiveMainCategoryId(category.id);
    setActiveSubCategoryId(firstChild.id);
    setCategoryMode(firstChild.apiCategory);
    setActiveKeyword(nextKeyword);
    setSelectedMapPlace(null);
    setCurrentPage(1);

    if (location) {
      await searchNearbyRestaurants(location, firstChild.apiCategory, nextKeyword);
    }
  }

  async function handleSubCategoryClick(child: SubCategory) {
    const nextKeyword = child.keyword || "";

    setActiveSubCategoryId(child.id);
    setCategoryMode(child.apiCategory);
    setActiveKeyword(nextKeyword);
    setSelectedMapPlace(null);
    setCurrentPage(1);

    if (location) {
      await searchNearbyRestaurants(location, child.apiCategory, nextKeyword);
    }
  }

  function handleFilterChange(nextFilter: FilterMode) {
    setFilterMode(nextFilter);
    setSelectedMapPlace(null);
    setCurrentPage(1);
  }

  function handleSortChange(nextSort: SortMode) {
    setSortMode(nextSort);
    setSelectedMapPlace(null);
    setCurrentPage(1);
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
                已取得定位，正在以你目前位置搜尋 3 公里內的店家。
              </p>
            ) : (
              <p className="mt-2 text-sm font-bold leading-6 text-stone-500">
                請先點擊上方「使用目前位置」。
              </p>
            )}
          </div>

          {places.length > 0 && (
            <div className="mt-5 space-y-5">
              <div className="grid grid-cols-3 rounded-[18px] bg-stone-100 p-1 text-xs font-black md:max-w-xl md:text-sm">
                <button
                  type="button"
                  onClick={() => handleFilterChange("open")}
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
                  onClick={() => handleFilterChange("closed")}
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
                  onClick={() => handleFilterChange("all")}
                  className={`rounded-[14px] px-3 py-3 transition ${
                    filterMode === "all"
                      ? "bg-orange-500 text-white shadow-sm"
                      : "text-stone-500 hover:bg-white"
                  }`}
                >
                  🍽 全部 ({places.length})
                </button>
              </div>

              <div className="rounded-[24px] border border-orange-100 bg-orange-50 p-4">
                <div className="mb-3 text-sm font-black text-orange-700">
                  先選想吃的類型
                </div>

                <div className="flex flex-wrap gap-2">
                  {CATEGORY_GROUPS.map((category) => (
                    <CategoryButton
                      key={category.id}
                      active={activeMainCategoryId === category.id}
                      onClick={() => handleMainCategoryClick(category)}
                    >
                      {category.label}
                    </CategoryButton>
                  ))}
                </div>

                <div className="mt-4 border-t border-orange-200 pt-4">
                  <div className="mb-3 text-sm font-black text-stone-600">
                    再細選：{activeMainCategory.label}
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {activeMainCategory.children.map((child) => (
                      <SubCategoryButton
                        key={child.id}
                        active={activeSubCategoryId === child.id}
                        onClick={() => handleSubCategoryClick(child)}
                      >
                        {child.label}
                      </SubCategoryButton>
                    ))}
                  </div>

                  {activeKeyword && (
                    <p className="mt-3 text-xs font-bold leading-5 text-stone-500">
                      目前搜尋關鍵字：{activeKeyword}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <SortButton active={sortMode === "distance"} onClick={() => handleSortChange("distance")}>
                  📍 最近距離
                </SortButton>

                <SortButton active={sortMode === "rating"} onClick={() => handleSortChange("rating")}>
                  ⭐ 最高評分
                </SortButton>

                <SortButton active={sortMode === "reviews"} onClick={() => handleSortChange("reviews")}>
                  🔥 討論度
                </SortButton>

                <SortButton active={sortMode === "risk"} onClick={() => handleSortChange("risk")}>
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

          {!isSearching && location && filteredPlaces.length > 0 && (
            <div className="mt-6 space-y-5">
              <div>
                <h3 className="mb-3 text-xl font-black">🗺 地圖位置</h3>

                <div className="overflow-hidden rounded-[28px] border border-stone-200">
                  <NearbyMap
                    center={{ lat: location.latitude, lng: location.longitude }}
                    places={filteredPlaces}
                    onSelectPlace={(place) => setSelectedMapPlace(place)}
                    onSearchArea={async (nextCenter) => {
                      const nextLocation = {
                        latitude: nextCenter.lat,
                        longitude: nextCenter.lng,
                      };

                      setLocation(nextLocation);
                      await searchNearbyRestaurants(nextLocation, categoryMode, activeKeyword);
                    }}
                  />
                </div>
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

              <div>
                <div className="mb-3 flex items-end justify-between gap-3">
                  <div>
                    <h3 className="text-xl font-black">📋 店家清單</h3>
                    <p className="mt-1 text-sm font-bold text-stone-500">
                      共 {filteredPlaces.length} 間，第 {currentPage} / {totalPages} 頁
                    </p>
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  {pagedPlaces.map((place) => {
                    const photoUrl = getPhotoUrl(place.photoName);
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

                {totalPages > 1 && (
                  <div className="mt-6 flex items-center justify-center gap-3">
                    <button
                      type="button"
                      onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                      disabled={currentPage === 1}
                      className="rounded-full bg-stone-100 px-5 py-3 text-sm font-black text-stone-600 transition hover:bg-stone-200 disabled:opacity-40"
                    >
                      ← 上一頁
                    </button>

                    <div className="rounded-full bg-orange-100 px-5 py-3 text-sm font-black text-orange-700">
                      第 {currentPage} / {totalPages} 頁
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        setCurrentPage((page) => Math.min(totalPages, page + 1))
                      }
                      disabled={currentPage === totalPages}
                      className="rounded-full bg-stone-100 px-5 py-3 text-sm font-black text-stone-600 transition hover:bg-stone-200 disabled:opacity-40"
                    >
                      下一頁 →
                    </button>
                  </div>
                )}
              </div>
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
          : "bg-white text-stone-700 hover:bg-stone-100"
      }`}
    >
      {children}
    </button>
  );
}

function SubCategoryButton({
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
      className={`rounded-full border px-4 py-2 text-sm font-black transition ${
        active
          ? "border-orange-500 bg-orange-500 text-white"
          : "border-orange-200 bg-white text-stone-600 hover:bg-orange-100"
      }`}
    >
      {children}
    </button>
  );
}