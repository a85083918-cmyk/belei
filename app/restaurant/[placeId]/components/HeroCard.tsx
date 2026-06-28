import Image from "next/image";
import PaperCard from "./PaperCard";

export default function HeroCard({
  place,
  isOpen,
  copied,
  onShare,
}: {
  place: any;
  isOpen: boolean;
  copied: boolean;
  onShare: () => void;
}) {
  return (
    <PaperCard className="mt-5">
      <div className="grid items-center gap-8 md:grid-cols-[1fr_300px]">
        <div>
          <p className="text-sm font-black tracking-widest text-orange-500">
            BeLei 避雷軍師報告
          </p>

          <h1 className="mt-3 text-4xl font-black leading-tight md:text-5xl">
            {place.displayName?.text}
          </h1>

          <p className="mt-4 leading-7 text-stone-600">
            {place.formattedAddress}
          </p>

          <div className="mt-5 flex flex-wrap gap-3">
            <Badge>Google {place.rating ?? "-"}★</Badge>
            <Badge>{place.userRatingCount ?? 0} 則評論</Badge>
            <Badge>{isOpen ? "營業中" : "目前未營業"}</Badge>
          </div>

          <button
            onClick={onShare}
            className="mt-5 rounded-2xl border-2 border-orange-300 bg-orange-50 px-5 py-3 font-black text-orange-700 transition hover:-translate-y-0.5 hover:bg-orange-100"
          >
            {copied ? "✅ 已複製報告" : "📤 分享報告"}
          </button>
        </div>

        <div className="hidden items-center justify-center md:flex">
          <Image
            src="/illustrations/restaurant-shop.png"
            alt="餐廳插圖"
            width={300}
            height={220}
            priority
            className="select-none drop-shadow-[0_20px_10px_rgba(0,0,0,0.30)]"
          />
        </div>
      </div>
    </PaperCard>
  );
}

function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-full border-2 border-orange-200 bg-orange-50 px-4 py-2 text-sm font-black text-orange-700">
      {children}
    </span>
  );
}