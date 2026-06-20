"use client";

import { useEffect, useState } from "react";

export default function ReportButton({
  name,
  address,
  rating,
  userRatingCount,
  reviews,
}: {
  name: string;
  address: string;
  rating: number;
  userRatingCount: number;
  reviews: any[];
}) {
  const [loading, setLoading] = useState(true);
  const [report, setReport] = useState("");

  async function generateReport() {
    setLoading(true);
    setReport("");

    try {
      const res = await fetch("/api/report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          address,
          rating,
          userRatingCount,
          reviews,
        }),
      });

      const data = await res.json();
      setReport(data.report || "報告產生失敗，請稍後再試。");
    } catch {
      setReport("報告產生失敗，請稍後再試。");
    }

    setLoading(false);
  }

  useEffect(() => {
    generateReport();
  }, []);

  function getSection(title: string) {
    const regex = new RegExp(`## ${title}([\\s\\S]*?)(?=\\n## |$)`);
    const match = report.match(regex);
    return match ? match[1].trim() : "";
  }

  function renderText(text: string) {
    return text.split("\n").map((line, index) => {
      const cleanLine = line.trim();

      if (!cleanLine) return null;

      if (cleanLine.startsWith("-")) {
        return (
          <li key={index} className="mb-2 leading-7 text-gray-700">
            {cleanLine.replace("-", "").trim()}
          </li>
        );
      }

      return (
        <p key={index} className="mb-3 leading-8 text-gray-700">
          {cleanLine}
        </p>
      );
    });
  }

  if (loading) {
    return (
      <section className="mt-8 rounded-3xl border border-orange-200 bg-orange-50 p-10 shadow-sm">
        <div className="flex flex-col items-center justify-center text-center">
          <div className="h-14 w-14 animate-spin rounded-full border-4 border-orange-200 border-t-orange-500" />

          <h2 className="mt-6 text-3xl font-black text-orange-600">
            AI 軍師分析中...
          </h2>

          <p className="mt-3 text-gray-600">
            正在讀取 Google 評論，產生 BeLei 避雷報告
          </p>

          <p className="mt-2 text-sm text-gray-400">
            通常需要 5～15 秒，請不要關閉頁面
          </p>
        </div>
      </section>
    );
  }

  const finalVerdict = getSection("🍅 軍師最終判決");
  const oneTruth = getSection("🎯 一句真話");
  const maxRisk = getSection("🚨 最大風險");
  const expectationGap = getSection("🚨 期待落差指數");
  const risks = getSection("⚡ 雷點整理");
  const badFor = getSection("❌ 容易踩雷的人");
  const worthTrip = getSection("🚗 值不值得專程前往");
  const delivery = getSection("📦 外送資訊");
  const order = getSection("📱 立即訂餐");
  const business = getSection("🕒 營業狀態");
  const shopInfo = getSection("📌 店家資料");

  return (
    <section className="mt-8 space-y-6">
      <div className="rounded-3xl bg-gradient-to-r from-orange-500 to-orange-400 p-8 text-white shadow-lg">
        <div className="text-5xl">🍅</div>

        <h2 className="mt-4 text-4xl font-black">
          BeLei 軍師報告
        </h2>

        <p className="mt-3 text-orange-100">
          Google 告訴你有多紅，我們告訴你會不會後悔。
        </p>
      </div>

      <Card title="🍅 軍師最終判決" highlight>
        {renderText(finalVerdict)}
      </Card>

      <Card title="🎯 一句真話">
        {renderText(oneTruth)}
      </Card>

      <Card title="🚨 最大風險">
        {renderText(maxRisk)}
      </Card>

      <Card title="🚨 期待落差指數">
        {renderText(expectationGap)}
      </Card>

      <Card title="⚡ 雷點整理">
        <ul className="list-disc pl-5">{renderText(risks)}</ul>
      </Card>

      <Card title="❌ 容易踩雷的人">
        <ul className="list-disc pl-5">{renderText(badFor)}</ul>
      </Card>

      <Card title="🚗 值不值得專程前往">
        {renderText(worthTrip)}
      </Card>

      <Card title="📦 外送資訊">
        {renderText(delivery)}
      </Card>

      <Card title="📱 立即訂餐">
        {renderText(order)}
      </Card>

      <Card title="🕒 營業狀態">
        {renderText(business)}
      </Card>

      <Card title="📌 店家資料">
        {renderText(shopInfo)}
      </Card>
    </section>
  );
}

function Card({
  title,
  children,
  highlight = false,
}: {
  title: string;
  children: React.ReactNode;
  highlight?: boolean;
}) {
  return (
    <div
      className={`rounded-3xl border p-7 shadow-sm ${
        highlight
          ? "border-orange-300 bg-orange-50"
          : "border-gray-200 bg-white"
      }`}
    >
      <h3 className="mb-4 text-2xl font-black text-black">{title}</h3>
      <div>{children}</div>
    </div>
  );
}