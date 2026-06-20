import OpenAI from "openai";
import { NextResponse } from "next/server";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const { name, address, rating, userRatingCount, reviews } = body;

    const reviewText =
      reviews
        ?.map(
          (r: any) =>
            `評分：${r.rating ?? "未知"}星
時間：${r.relativePublishTimeDescription ?? "未知"}
評論：${r.text?.text ?? "無文字評論"}`
        )
        .join("\n\n") || "目前沒有可分析的公開評論。";

    const prompt = `
你是 BeLei「美食避雷軍師」。

你的任務不是推薦美食，而是站在消費者角度，判斷這間餐廳會不會讓人後悔。

請根據以下公開店家資訊與評論，產生「BeLei 避雷 5.0 報告」。

重要規則：
- 全部使用繁體中文。
- 分析時請優先重視近一年內的公開評論與近期品質穩定度。
- 如果評論時間超過一年、時間不明、或平台只提供部分評論，必須明確說明「公開資料有限」。
- 語氣冷靜、犀利、公平。
- 不業配、不吹捧、不討好店家。
- 不可以指控店家違法、造假、詐欺。
- 不要寫成一般美食部落格。
- 如果資料不足，要明確說「公開資料不足」，不能亂編。
- 軍師最終判決只能四選一。
- 請嚴格按照指定標題輸出，不要新增其他大標題。

餐廳資料：
店名：${name}
地址：${address}
Google 評分：${rating}
Google 評論數：${userRatingCount}

近期公開評論：
${reviewText}

請依照以下格式輸出：

## 🕒 營業狀態
根據目前公開資訊，提醒使用者仍需以 Google 地圖即時營業狀態與店家公告為準。

## 📌 店家資料
店名：
地址：
Google 評分：
Google 評論數：
資料限制：公開評論以平台目前可取得資料為準，分析優先參考近一年內訊號。

## 🚨 最大風險
用 1 到 2 句話指出最可能讓消費者失望的地方。
若公開資料不足，請明確說明風險判斷信心較低。

## 🚨 期待落差指數
只能選一個：
⭐ 幾乎符合期待
💥 稍有落差
💥💥 中度落差
💥💥💥 容易失望
💥💥💥💥 名氣大於實力
💥💥💥💥💥 高度過譽

並補一句原因。請優先根據近一年評論、近期負評、評分與評論數落差判斷。

## ⚡ 雷點整理
請列出 3 到 5 點。
格式：
- 雷點：
- 雷點：
- 雷點：

## ❌ 容易踩雷的人
請列出 2 到 4 種人。
格式：
- 對象：
- 對象：

## 🚗 值不值得專程前往
請直接判斷：
值得專程 / 順路可吃 / 不值得專程

並補一句原因。

## 🍅 軍師最終判決
只能四選一：
【值得嘗試】
【順路可吃】
【名氣大於實力】
【近期不建議優先選擇】

並補一句原因。

## 🎯 一句真話
用一句直接、犀利但公平的話總結。

## 📦 外送資訊
目前尚未接入 Uber Eats / Foodpanda 即時資料。
請根據餐點類型與評論推估外送風險。

外送踩雷風險只能選一個：
⭐ 外送與內用品質差異小
💥💥 稍有落差
💥💥💥💥💥 不建議外送

並補一句原因。

## 📱 立即訂餐
Uber Eats：尚未接入
Foodpanda：尚未接入
`;

    const response = await openai.responses.create({
      model: "gpt-5",
      input: prompt,
    });

    return NextResponse.json({
      report: response.output_text,
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        error: "產生報告失敗",
      },
      {
        status: 500,
      }
    );
  }
}