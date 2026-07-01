import PaperCard from "./PaperCard";

type Alternative = {
  placeId: string;
  name: string;
  address: string;
  rating: number | null;
  userRatingCount: number;
  distance: number | null;
  photoName?: string | null;
  safetyScore: number;
};

function formatDistance(distance: number | null) {
  if (distance === null) return "距離未知";
  if (distance >= 1000) return `${(distance / 1000).toFixed(1)}km`;
  return `${distance}m`;
}

function getSafetyStyle(score: number) {
  if (score >= 80) return "bg-green-100 text-green-700";
  if (score >= 70) return "bg-lime-100 text-lime-700";
  return "bg-yellow-100 text-orange-700";
}

function getRecommendReasons(place: Alternative) {
  const reasons: string[] = [];

  if (place.safetyScore >= 85) reasons.push("安心分數高");
  if (place.rating && place.rating >= 4.6) reasons.push("Google 評價穩定");

  if (place.userRatingCount >= 1000) reasons.push("評論數充足");
  else if (place.userRatingCount >= 300) reasons.push("評價樣本足夠");

  if (place.distance !== null && place.distance <= 500) reasons.push("距離很近");
  else if (place.distance !== null && place.distance <= 1200)
    reasons.push("距離可接受");

  if (!reasons.length) reasons.push("可作為附近比較選項");

  return reasons.slice(0, 3);
}

export default function AlternativesCard({
  alternatives,
  safetyScore,
  onOpenReport,
}: {
  alternatives: Alternative[];
  safetyScore: number;
  onOpenReport: (place: Alternative) => void;
}) {
  const betterAlternatives = alternatives.filter(
    (place) => place.safetyScore >= safetyScore
  );

  if (!betterAlternatives.length) return null;

  return (
    <PaperCard color="green">
      <h3 className="text-3xl font-black text-green-700">
        🍀 附近推薦比較
      </h3>

      <p className="mt-3 leading-7 text-stone-700">
        BeLei 只列出安心分數不低於目前店家的附近選擇，避免推薦越比越雷的店。
      </p>

      <div className="mt-6 grid gap-4 md:grid-cols-3">
        {betterAlternatives.map((place, index) => {
          const reasons = getRecommendReasons(place);

          return (
            <div
              key={place.placeId}
              className="flex min-h-[320px] flex-col rounded-[24px] border-2 border-green-100 bg-white/80 p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
            >
              <div className="text-2xl font-black leading-8 text-stone-900">
                {index === 0 ? "🥇" : index === 1 ? "🥈" : "🥉"} {place.name}
              </div>

              <div className="mt-4 flex flex-wrap gap-2 text-sm font-black">
                <span
                  className={`rounded-full px-3 py-2 ${getSafetyStyle(
                    place.safetyScore
                  )}`}
                >
                  🛡️ 安心 {place.safetyScore}/100
                </span>

                <span className="rounded-full bg-stone-100 px-3 py-2 text-stone-600">
                  ⭐ {place.rating ? place.rating.toFixed(1) : "無評分"}
                </span>

                <span className="rounded-full bg-stone-100 px-3 py-2 text-stone-600">
                  💬{" "}
                  {place.userRatingCount > 0
                    ? `${place.userRatingCount.toLocaleString()} 則`
                    : "評論不足"}
                </span>

                <span className="rounded-full bg-stone-100 px-3 py-2 text-stone-600">
                  📍 {formatDistance(place.distance)}
                </span>
              </div>

              <div className="mt-4 rounded-2xl bg-green-50 p-3">
                <div className="text-sm font-black text-green-700">
                  ✨ 推薦理由
                </div>

                <div className="mt-2 flex flex-wrap gap-2">
                  {reasons.map((reason) => (
                    <span
                      key={reason}
                      className="rounded-full bg-white px-3 py-1 text-xs font-black text-green-700"
                    >
                      {reason}
                    </span>
                  ))}
                </div>
              </div>

              <p className="mt-4 line-clamp-2 text-sm font-bold leading-6 text-stone-500">
                {place.address || "地址資料不足"}
              </p>

              <button
                type="button"
                onClick={() => onOpenReport(place)}
                className="mt-auto w-full rounded-2xl bg-green-700 px-4 py-3 text-sm font-black text-white transition hover:bg-green-800"
              >
                查看避雷報告 →
              </button>
            </div>
          );
        })}
      </div>
    </PaperCard>
  );
}