import PaperCard from "./PaperCard";

export default function RiskCard({
  risks,
  renderContent,
}: {
  risks: string;
  renderContent: (text: string) => React.ReactNode;
}) {
  return (
    <PaperCard small color="orange">
      <h3 className="text-2xl font-black text-orange-700">⚡ 雷點整理</h3>
      <div className="mt-4">{renderContent(risks)}</div>
    </PaperCard>
  );
}