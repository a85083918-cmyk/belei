import PaperCard from "./PaperCard";

export default function ScoreCard({
  safetyScore,
  riskLevel,
  confidence,
}: {
  safetyScore: number;
  riskLevel: string;
  confidence: {
    stars: string;
    title: string;
  };
}) {
  return (
    <PaperCard medal>
      <div className="grid items-start gap-8 md:grid-cols-3">
        <div className="md:border-r-2 md:border-stone-200 md:pr-8">
          <h2 className="text-2xl font-black">BeLei 安心分數</h2>

          <div className="mt-5 flex items-end gap-2">
            <span className="number-font text-7xl font-black text-orange-500">
              {safetyScore}
            </span>
            <span className="mb-3 text-2xl font-black">/100</span>
          </div>

          <div className="mt-3 inline-flex rounded-full bg-orange-100 px-4 py-2 font-black text-orange-700">
            🛡️ {riskLevel}
          </div>

          <div className="mt-5 h-4 overflow-hidden rounded-full bg-stone-200">
            <div
              className="h-full rounded-full bg-orange-400"
              style={{ width: `${safetyScore}%` }}
            />
          </div>
        </div>

        <div className="md:border-r-2 md:border-stone-200 md:px-8">
          <h2 className="text-2xl font-black">本次分析信心</h2>
          <div className="mt-6 text-4xl text-yellow-500">
            {confidence.stars}
          </div>
          <div className="mt-5 inline-flex rounded-full border-2 border-blue-300 bg-blue-50 px-5 py-2 text-xl font-black text-blue-600">
            {confidence.title}
          </div>
        </div>

        <div className="md:pl-8">
          <h2 className="text-2xl font-black">本次主要風險來源</h2>
          <ul className="mt-5 space-y-3 leading-8">
            <li>• 近期負評與公開評論訊號</li>
            <li>• 評分與評論數的落差</li>
            <li>• 高期待可能產生體驗落差</li>
            <li>• 營業與尖峰時段穩定度</li>
          </ul>
        </div>
      </div>
    </PaperCard>
  );
}