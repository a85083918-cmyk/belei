import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

type SearchCountMap = Record<string, number>;

const dataDir = path.join(process.cwd(), "data");
const filePath = path.join(dataDir, "search-count.json");

function normalizeKeyword(keyword: string) {
  return keyword
    .replace(/\s+/g, " ")
    .replace(
      /(台北市|台北|新北市|新北|桃園市|桃園|台中市|台中|台南市|台南|高雄市|高雄)$/g,
      ""
    )
    .trim();
}

function ensureDataFile() {
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, "{}", "utf-8");
  }
}

function readSearchCount(): SearchCountMap {
  try {
    ensureDataFile();

    const file = fs.readFileSync(filePath, "utf-8");
    return JSON.parse(file || "{}");
  } catch (error) {
    console.error("讀取搜尋紀錄失敗", error);
    return {};
  }
}

function writeSearchCount(data: SearchCountMap) {
  try {
    ensureDataFile();
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf-8");
  } catch (error) {
    console.error("寫入搜尋紀錄失敗", error);
  }
}

export async function POST(request: Request) {
  const body = await request.json();

  const keyword = normalizeKeyword(String(body.keyword || ""));

  if (!keyword) {
    return NextResponse.json({ ok: false });
  }

  const store = readSearchCount();

  store[keyword] = (store[keyword] || 0) + 1;

  writeSearchCount(store);

  return NextResponse.json({
    ok: true,
    keyword,
    count: store[keyword],
    filePath,
  });
}

export async function GET() {
  const store = readSearchCount();

  const rankings = Object.entries(store)
    .map(([keyword, count]) => ({
      keyword,
      count,
    }))
    .sort((a, b) => b.count - a.count);

  return NextResponse.json({
    rankings,
    filePath,
  });
}