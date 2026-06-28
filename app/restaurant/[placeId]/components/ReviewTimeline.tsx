import PaperCard from "./PaperCard";

export default function ReviewTimeline({ reviews }: { reviews: any[] }) {
  return (
    <PaperCard>
      <h3 className="text-2xl font-black">🧾 BeLei 判斷依據（近一年優先）</h3>

      <p className="mt-4 leading-8 text-stone-700">
        Google Places 僅提供部分公開評論，不等於完整一年評論資料。
        BeLei 會優先參考目前可取得的近期評論與品質穩定度。
      </p>

      <div className="mt-6 space-y-4">
        {reviews.length ? (
          reviews.map((review: any, index: number) => (
            <div
              key={index}
              className="rounded-[20px] border-2 border-stone-100 bg-[#fffdf7] p-5"
            >
              <p className="font-black">
                {review.rating ?? "-"}★・
                {review.relativePublishTimeDescription ?? "時間未提供"}
              </p>
              <p className="mt-3 leading-8 text-stone-700">
                {review.text?.text || "無文字評論"}
              </p>
            </div>
          ))
        ) : (
          <p>目前沒有可顯示的近期公開評論。</p>
        )}
      </div>
    </PaperCard>
  );
}