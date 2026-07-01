import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

function safeJsonParse(text: string) {
  try {
    return JSON.parse(text);
  } catch {
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) return null;

    try {
      return JSON.parse(match[0]);
    } catch {
      return null;
    }
  }
}

async function analyzeIntent(q: string, defaultCity: string) {
  if (!q.trim()) {
    return NextResponse.json({ error: "Missing query" }, { status: 400 });
  }

  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json(
      { error: "Missing OPENAI_API_KEY" },
      { status: 500 }
    );
  }

  const response = await client.responses.create({
    model: "gpt-5",
    input: `
你是 BeLei 的搜尋意圖分析器。

BeLei 是「吃飯前先避雷」的 AI 餐廳決策工具。
你的工作是把使用者輸入轉成最適合 Google Places 搜尋的餐廳關鍵字。

請只回 JSON，不要加 markdown，不要加說明。

JSON 格式：
{
  "keyword": "最適合 Google Places 搜尋的餐廳關鍵字",
  "city": "城市",
  "reason": "一句話說明你為什麼這樣判斷"
}

規則：
- 如果使用者沒有指定城市，city 使用「${defaultCity}」。
- keyword 不要包含城市，只放餐廳類型、料理、店名或需求。
- 如果使用者輸入店名，keyword 保留店名。
- 「想吃牛肉麵」=> keyword 必須是「牛肉麵」。
- 「義大利麵」=> keyword 必須是「義大利麵」，不要變成「麵店」。
- 「咖哩飯」=> keyword 必須是「咖哩飯」，不要變成「餐廳」。
- 「想吃辣」=> keyword 可轉成「麻辣火鍋」或「川菜」。
- 「約會」=> keyword 可轉成「約會餐廳」。
- 「300元內 / 便宜 / 平價」=> keyword 可轉成「平價餐廳」。
- 不要把明確料理降級成「餐廳」。

使用者輸入：
${q}
`,
  });

  const outputText = response.output_text || "";
  const parsed = safeJsonParse(outputText);

  if (!parsed?.keyword) {
    return NextResponse.json({
      keyword: q,
      city: defaultCity,
      reason: "AI 判斷失敗，使用原始輸入作為搜尋關鍵字。",
      fallback: true,
    });
  }

  return NextResponse.json({
    keyword: parsed.keyword || q,
    city: parsed.city || defaultCity,
    reason: parsed.reason || "",
    fallback: false,
  });
}

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;

  const q = searchParams.get("q") || "";
  const defaultCity = searchParams.get("city") || "高雄";

  return analyzeIntent(q, defaultCity);
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));

  const q = body.query || body.q || "";
  const defaultCity = body.city || "高雄";

  return analyzeIntent(q, defaultCity);
}