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

export default function AlternativesCard({
  alternatives,
  onOpenReport,
}: {
  alternatives: Alternative[];
  onOpenReport: (place: Alternative) => void;
}) {
  if (!alternatives.length) return null;

  return (
    <PaperCard color="green">
      <h3 className="text-3xl font-black text-green-700">
        🍀 附近更穩選擇
      </h3>

      <p className="mt-3 leading-7 text-stone-700">
        這間店目前風險偏高，BeLei 幫你找了附近同類型、安心分數較高的選擇。
      </p>

      <div className="mt-6 grid gap-4 md:grid-cols-3">
        {alternatives.map((place, index) => (
          <div
            key={place.placeId}
            className="rounded-[24px] border-2 border-green-100 bg-white/80 p-5"
          >
            <div className="text-2xl font-black">
              {index === 0 ? "🥇" : index === 1 ? "🥈" : "🥉"} {place.name}
            </div>

            <div className="mt-4 flex flex-wrap gap-2 text-sm font-black">
              <span className="rounded-full bg-orange-100 px-3 py-2 text-orange-700">
                🛡️ {place.safetyScore}/100
              </span>

              <span className="rounded-full bg-stone-100 px-3 py-2 text-stone-600">
                ⭐ {place.rating ?? "無評分"}
              </span>

              <span className="rounded-full bg-stone-100 px-3 py-2 text-stone-600">
                {place.userRatingCount.toLocaleString()} 則
              </span>

              {place.distance !== null && (
                <span className="rounded-full bg-stone-100 px-3 py-2 text-stone-600">
                  📍 {place.distance}m
                </span>
              )}
            </div>

            <p className="mt-4 line-clamp-2 text-sm leading-6 text-stone-500">
              {place.address}
            </p>

            <button
              type="button"
              onClick={() => onOpenReport(place)}
              className="mt-5 w-full rounded-2xl bg-green-700 px-4 py-3 text-sm font-black text-white transition hover:bg-green-800"
            >
              查看完整避雷報告
            </button>
          </div>
        ))}
      </div>
    </PaperCard>
  );
}