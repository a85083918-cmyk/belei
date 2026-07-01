export default function FixedImageRankCard({
    label,
    name,
    subtitle,
    score,
    meta,
    imageSrc,
    tone,
    query,
    onSearch,
  }: {
    label: string;
    name: string;
    subtitle: string;
    score: string;
    meta: string;
    imageSrc: string;
    tone: "red" | "green";
    query: string;
    onSearch: (value: string) => void;
  }) {
    const toneClass =
      tone === "red"
        ? {
            card: "bg-red-50 border-red-100",
            pill: "bg-red-100 text-red-600",
            score: "text-red-600",
            button: "border-red-400 text-red-600",
          }
        : {
            card: "bg-green-50 border-green-100",
            pill: "bg-green-100 text-green-700",
            score: "text-green-700",
            button: "border-green-500 text-green-700",
          };
  
    return (
      <button
        onClick={() => onSearch(query)}
        className={`block w-full overflow-hidden rounded-[26px] border p-4 text-left shadow-[5px_5px_0_#ead8b5] ${toneClass.card}`}
      >
        <div className="flex gap-3">
          <div className="flex flex-1 flex-col justify-between">
            <div>
              <div
                className={`w-fit rounded-2xl px-3 py-2 text-xs font-black ${toneClass.pill}`}
              >
                {label}
              </div>
  
              <h3 className="mt-3 text-2xl font-black">{name}</h3>
  
              <p className="mt-2 text-sm font-bold text-stone-700">
                {subtitle}{" "}
                <span className={`text-xl font-black ${toneClass.score}`}>
                  {score}
                </span>
              </p>
  
              <p className="mt-1 text-xs font-bold text-stone-600">{meta}</p>
            </div>
  
            <div
              className={`mt-3 w-fit rounded-2xl border bg-white px-3 py-2 text-xs font-black ${toneClass.button}`}
            >
              查看分析報告
            </div>
          </div>
  
          <div className="h-32 w-[38%] shrink-0 overflow-hidden rounded-[22px] bg-stone-200">
            <img src={imageSrc} alt={name} className="h-full w-full object-cover" />
          </div>
        </div>
      </button>
    );
  }