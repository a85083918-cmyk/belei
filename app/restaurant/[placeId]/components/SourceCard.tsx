export default function SourceCard() {
    return (
      <div className="rounded-[22px] border border-stone-200 bg-white/60 px-5 py-4 text-xs leading-6 text-stone-400">
        ℹ️ 資料來源：Google Places、公開評論資料、BeLei 分析模型整理。
        Google Places 僅提供部分公開評論，不等於完整一年評論資料；BeLei
        會優先參考目前可取得的近期評論與品質穩定度。外送平台資料後續將接入公開頁面資訊。
      </div>
    );
  }