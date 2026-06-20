import { NextResponse } from "next/server";
import { homeRankings } from "@/lib/homeRankings";
import fs from "fs";
import path from "path";

type SearchCountMap = Record<string, number>;

type RankingItem = {
  name: string;
  query: string;
  subtitle: string;
  photoName?: string | null;
};

const globalForSearchCount = globalThis as unknown as {
  searchCountStore?: SearchCountMap;
};

export const dynamic = "force-dynamic";

function readJsonFile<T>(fileName: string, fallback: T): T {
  try {
    const filePath = path.join(process.cwd(), "data", fileName);

    if (!fs.existsSync(filePath)) {
      return fallback;
    }

    const file = fs.readFileSync(filePath, "utf-8");

    if (!file.trim()) {
      return fallback;
    }

    return JSON.parse(file) as T;
  } catch (error) {
    console.error(`${fileName} 載入失敗`, error);
    return fallback;
  }
}

export async function GET() {
  const searchCountStore = readJsonFile<SearchCountMap>(
    "search-count.json",
    globalForSearchCount.searchCountStore || {}
  );

  const autoHotSearches: RankingItem[] = Object.entries(searchCountStore)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4)
    .map(([keyword, count]) => ({
      name: keyword,
      query: keyword,
      subtitle: `被搜尋 ${count} 次`,
    }));

  const expectationGap = readJsonFile<RankingItem[]>(
    "expectation-gap.json",
    homeRankings.expectationGap
  );

  const stableStores = readJsonFile<RankingItem[]>(
    "stable-stores.json",
    homeRankings.stableStores
  );

  return NextResponse.json({
    updatedAt: new Date().toISOString(),
    source: "json-mvp",

    hotSearches:
      autoHotSearches.length > 0
        ? autoHotSearches
        : homeRankings.hotSearches,

    expectationGap,
    stableStores,
  });
}