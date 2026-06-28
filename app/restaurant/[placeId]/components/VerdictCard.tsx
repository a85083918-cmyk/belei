import PaperCard from "./PaperCard";

export default function VerdictCard({
  verdictText,
  verdictReason,
}: {
  verdictText: string;
  verdictReason: React.ReactNode;
}) {
  return (
    <PaperCard>
      <div className="text-center">
        <h2 className="text-3xl font-black">🍅 BeLei 終極結論</h2>

        <div className="mx-auto mt-5 inline-flex rounded-full border-2 border-yellow-600 bg-yellow-300 px-10 py-4 text-3xl font-black shadow-[4px_4px_0_#d6a63a]">
          🙂 {verdictText}
        </div>

        <div className="mx-auto mt-7 max-w-2xl leading-8">
          {verdictReason}
        </div>
      </div>
    </PaperCard>
  );
}