import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

type SearchCountMap = Record<string, number>;

type RankingItem = {
  name: string;
  query: string;
  subtitle: string;
};

const dataDir = path.join(process.cwd(), "data");
const searchCountPath = path.join(dataDir, "search-count.json");
const expectationGapPath = path.join(dataDir, "expectation-gap.json");
const stableStoresPath = path.join(dataDir, "stable-stores.json");

function ensureDataDir() {
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
}

function readSearchCount(): SearchCountMap {
  try {
    ensureDataDir();

    if (!fs.existsSync(searchCountPath)) {
      return {};
    }

    const file = fs.readFileSync(searchCountPath, "utf-8");

    if (!file.trim()) {
      return {};
    }

    return JSON.parse(file);
  } catch (error) {
    console.error("讀取 search-count.json 失敗", error);
    return {};
  }
}

function writeJson(filePath: string, data: unknown) {
  ensureDataDir();
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf-8");
}

function createExpectationGapRankings(searchCount: SearchCountMap): RankingItem[] {
  return Object.entries(searchCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([keyword, count], index) => {
      const score = Math.max(65, 90 - index * 4);

      return {
        name: keyword,
        query: keyword,
        subtitle: `💥 期待落差指數：${score}｜被搜尋 ${count} 次`,
      };
    });
}

function createStableStoreRankings(searchCount: SearchCountMap): RankingItem[] {
  return Object.entries(searchCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .reverse()
    .map(([keyword, count], index) => {
      const score = Math.max(70, 88 - index * 3);

      return {
        name: keyword,
        query: keyword,
        subtitle: `⭐ 穩定度：${score}｜被搜尋 ${count} 次`,
      };
    });
}

export async function POST() {
  const searchCount = readSearchCount();

  const expectationGap = createExpectationGapRankings(searchCount);
  const stableStores = createStableStoreRankings(searchCount);

  writeJson(expectationGapPath, expectationGap);
  writeJson(stableStoresPath, stableStores);

  return NextResponse.json({
    ok: true,
    message: "排行榜已自動產生",
    generated: {
      expectationGap,
      stableStores,
    },
  });
}

export async function GET() {
  return POST();
}