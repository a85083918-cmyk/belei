import { isTaiwanAddress } from "../utils";

export default function StickyNotes({
  oneTruth,
  worthTrip,
  menuBudget,
  address,
  renderContent,
}: {
  oneTruth: string;
  worthTrip: string;
  menuBudget: string;
  address?: string;
  renderContent: (text: string) => React.ReactNode;
}) {
  return (
    <div className="grid items-start gap-6 md:grid-cols-3">
      <StickyNote color="pink" title="💬 真心話">
        {renderContent(oneTruth)}
      </StickyNote>

      <StickyNote color="green" title="😊 適合">
        {renderContent(worthTrip)}
      </StickyNote>

      <StickyNote color="yellow" title="🍜 菜單與預算推估">
        <MenuBudget text={menuBudget} address={address} />
      </StickyNote>
    </div>
  );
}

function MenuBudget({ text, address }: { text: string; address?: string }) {
  const isTaiwan = isTaiwanAddress(address);

  if (!text) {
    return <p className="text-stone-500">資料不足，暫無明確內容。</p>;
  }

  return (
    <div className="space-y-4">
      {text
        .split("\n")
        .filter(Boolean)
        .map((line, i) => {
          const item = line.trim();

          if (isTaiwan && item.includes("台幣換算")) return null;
          if (isTaiwan && item.includes("不需換算")) return null;

          if (
            item.includes("NT$") ||
            item.includes("¥") ||
            item.includes("₩") ||
            item.includes("฿") ||
            item.includes("HK$") ||
            item.includes("S$")
          ) {
            return (
              <div
                key={i}
                className="rounded-2xl border border-stone-200 bg-white/70 px-4 py-3 font-black text-stone-900"
              >
                {item}
              </div>
            );
          }

          if (
            item.includes("中價位") ||
            item.includes("平價") ||
            item.includes("偏高") ||
            item.includes("高單價") ||
            item.includes("奢華")
          ) {
            return (
              <div
                key={i}
                className="inline-flex rounded-full bg-orange-100 px-4 py-2 font-black text-orange-700"
              >
                💸 {item}
              </div>
            );
          }

          if (item.includes("推薦品項")) {
            return (
              <div key={i} className="mt-2 font-black text-stone-900">
                ⭐ 推薦品項
              </div>
            );
          }

          if (item.startsWith("-")) {
            return (
              <div
                key={i}
                className="rounded-xl bg-stone-50 px-4 py-2 text-stone-700"
              >
                {item.replace("-", "").trim()}
              </div>
            );
          }

          if (item.includes("價格註記") || item.includes("AI 根據")) {
            return null;
          }

          return (
            <p key={i} className="leading-7 text-stone-700">
              {item}
            </p>
          );
        })}

      <div className="border-t border-stone-200 pt-4 text-xs leading-6 text-stone-500">
        🤖 價格與品項為 AI 根據公開資訊推估，實際仍以店家現場菜單為準。
      </div>
    </div>
  );
}

function StickyNote({
  title,
  children,
  color,
}: {
  title: string;
  children: React.ReactNode;
  color: "pink" | "green" | "yellow";
}) {
  const style =
    color === "pink"
      ? "border-pink-200 bg-pink-50 text-red-600"
      : color === "green"
      ? "border-green-200 bg-green-50 text-green-700"
      : "border-yellow-200 bg-yellow-50 text-orange-700";

  return (
    <div className={`h-fit rounded-[22px] border-2 p-5 ${style}`}>
      <h3 className="text-xl font-black">{title}</h3>
      <div className="mt-4 text-stone-800">{children}</div>
    </div>
  );
}