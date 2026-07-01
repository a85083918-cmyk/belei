import type { RefObject } from "react";
import { aiExamples } from "./homeData";

type LocationStatus = "idle" | "loading" | "granted" | "denied";

export default function HeroSearch({
  keyword,
  setKeyword,
  recentSearches,
  showRecent,
  setShowRecent,
  handleSearch,
  clearRecentSearches,
  recentRef,
  currentCity,
  locationStatus,
  onDetectLocation,
}: {
  keyword: string;
  setKeyword: (value: string) => void;
  recentSearches: string[];
  showRecent: boolean;
  setShowRecent: (value: boolean) => void;
  handleSearch: (value?: string) => void;
  clearRecentSearches: () => void;
  recentRef: RefObject<HTMLDivElement | null>;
  currentCity: string;
  locationStatus: LocationStatus;
  onDetectLocation: () => void;
}) {
  return (
    <div
      ref={recentRef}
      className="relative mx-auto mt-6 w-full max-w-3xl rounded-[24px] border border-white/30 bg-white p-2 shadow-[0_18px_45px_rgba(0,0,0,0.25)]"
    >
      <div className="mb-2 flex items-center justify-between px-2 text-left">
        <div className="text-xs font-black text-stone-500">
          📍 目前搜尋地區：
          <span className="text-orange-600">{currentCity}</span>
        </div>

        <button
          type="button"
          onClick={onDetectLocation}
          className="rounded-full bg-orange-50 px-3 py-2 text-xs font-black text-orange-600 hover:bg-orange-100"
        >
          {locationStatus === "loading"
            ? "定位中..."
            : locationStatus === "granted"
            ? "已使用定位"
            : "使用我的位置"}
        </button>
      </div>

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
          placeholder="例如：丹丹漢堡、今天想吃拉麵、高雄火鍋、附近咖啡廳..."
          className="min-w-0 flex-1 rounded-2xl bg-stone-50 px-4 py-4 text-sm font-bold text-stone-800 outline-none focus:bg-orange-50 md:text-lg"
        />

        <button
          onClick={() => handleSearch()}
          className="shrink-0 rounded-2xl bg-orange-500 px-4 py-4 text-sm font-black text-white hover:bg-orange-600 md:px-7 md:text-lg"
        >
          🔍 AI 幫我找
        </button>
      </div>

      <div className="mt-3 rounded-2xl bg-orange-50 px-4 py-3 text-left">
        <div className="text-xs font-black text-orange-600">
          ✨ 試試直接輸入需求，BeLei 會幫你挑不雷選擇
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          {aiExamples.map((example) => (
            <button
              key={example}
              type="button"
              onClick={() => handleSearch(example)}
              className="rounded-full bg-white px-3 py-2 text-xs font-black text-stone-700 shadow-sm transition hover:bg-orange-100 hover:text-orange-700"
            >
              {example}
            </button>
          ))}
        </div>
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
  );
}