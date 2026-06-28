import PaperCard from "./PaperCard";

export default function DeliveryCard({
  placeName,
  deliveryRisk,
}: {
  placeName: string;
  deliveryRisk: {
    emoji: string;
    title: string;
  };
}) {
  return (
    <PaperCard small color="green">
      <h3 className="text-2xl font-black text-green-700">🛵 外送體驗推估</h3>

      <div className="mt-4 inline-flex rounded-full bg-orange-100 px-4 py-2 font-black text-orange-700">
        {deliveryRisk.emoji} {deliveryRisk.title}（AI推估）
      </div>

      <div className="mt-5 space-y-3 text-stone-700">
        <p>• 熱食溫度可能下降</p>
        <p>• 尖峰時段等待時間較久</p>
        <p>• 部分餐點依賴現場口感完整度</p>
      </div>

      <div className="mt-5 rounded-2xl border border-orange-200 bg-orange-50 p-4 text-sm leading-7 text-stone-600">
        🤖 本結果根據 Google 公開評論、餐點特性、公開社群討論與常見外送情境進行 AI 推估，
        並非 Uber Eats 或 Foodpanda 即時訂單資料。
      </div>

      <div className="mt-6 border-t border-stone-200 pt-5">
        <h4 className="font-black text-stone-800">🛵 立即訂餐</h4>

        <div className="mt-4 flex flex-wrap gap-3">
          <button
            onClick={() =>
              window.open(
                `https://www.ubereats.com/search?q=${encodeURIComponent(
                  placeName
                )}`,
                "_blank"
              )
            }
            className="rounded-xl bg-black px-4 py-2 font-black text-white transition hover:scale-105"
          >
            Uber Eats
          </button>

          <button
            onClick={() =>
              window.open(
                `https://www.foodpanda.com.tw/search/${encodeURIComponent(
                  placeName
                )}`,
                "_blank"
              )
            }
            className="rounded-xl bg-[#ff2b85] px-4 py-2 font-black text-white transition hover:scale-105"
          >
            foodpanda
          </button>
        </div>
      </div>
    </PaperCard>
  );
}