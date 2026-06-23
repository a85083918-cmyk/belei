import OpenAI from "openai";
import { NextResponse } from "next/server";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const {
      name,
      address,
      rating,
      userRatingCount,
      reviews,
      openNow,
      types,
      googleMapsUri,
      fallbackContext,
    } = body;

    const hasReviews = Array.isArray(reviews) && reviews.length > 0;

    const reviewText = hasReviews
      ? reviews
          .map(
            (r: any) =>
              `評分：${r.rating ?? "未知"}星
時間：${r.relativePublishTimeDescription ?? "未知"}
評論：${r.text?.text ?? "無文字評論"}`
          )
          .join("\n\n")
      : "目前 Google Places 沒有提供可分析的公開評論文字。";

    const prompt = `
你是 BeLei「美食避雷軍師」。

你的任務不是推薦美食，而是站在消費者角度，判斷這間餐廳會不會讓人後悔。

請根據以下公開店家資訊，產生「BeLei 避雷 5.0 報告」。

重要規則：
- 全部使用繁體中文。
- 語氣冷靜、犀利、公平。
- 不業配、不吹捧、不討好店家。
- 不可以指控店家違法、造假、詐欺。
- 不要寫成一般美食部落格。
- 軍師最終判決只能四選一。
- 請嚴格按照指定標題輸出，不要新增其他大標題。
- 如果沒有評論文字，仍然必須產生基礎避雷報告。
- 沒有評論文字時，請根據店名、地址、Google 評分、評論數、營業狀態、店家類型做保守推估。
- 不可編造具體負評內容。
- 菜單與預算若沒有公開菜單，請根據店型、評論、常見市場價格合理推估，並標示 AI 推估。

餐廳資料：
店名：${name || "未知店家"}
地址：${address || "地址資料不足"}
Google 評分：${rating ?? "未提供"}
Google 評論數：${userRatingCount ?? 0}
目前營業狀態：${
      openNow === true ? "營業中" : openNow === false ? "目前未營業" : "未提供"
    }
店家類型：${Array.isArray(types) ? types.join(", ") : "未提供"}
Google Maps：${googleMapsUri || "未提供"}

補充背景：
${fallbackContext || "無"}

公開評論文字狀態：
${hasReviews ? "有公開評論文字可分析。" : "評論文字不足，以下為基礎風險推估。"}

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
資料限制：

## 🚨 最大風險
用 1 到 2 句話指出最可能讓消費者失望的地方。

## 🚨 期待落差指數
只能選一個：
⭐ 幾乎符合期待
💥 稍有落差
💥💥 中度落差
💥💥💥 容易失望
💥💥💥💥 名氣大於實力
💥💥💥💥💥 高度過譽

並補一句原因。

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

## 🍜 菜單與預算推估

平均菜單價位：
例如：
NT$100～NT$600
¥1,000～¥3,000
₩10,000～₩35,000

人均消費：
例如：
約 NT$300 / 人
約 ¥1,500 / 人
約 ₩18,000 / 人

消費等級：
只能選一個：
平價
中價位
偏高
高單價
奢華

台幣換算：
請根據店家地址自動判斷所在國家與幣別。

規則：
- 如果店家位於台灣，不需要顯示台幣換算。
- 如果店家位於海外，請保留當地貨幣，並另外提供約略新台幣換算。
- 不要要求使用者輸入國家或幣別。
- 可根據近期一般匯率進行合理推估，不需要即時匯率。

推薦品項：
請列出 2～4 個推薦品項。
品項不限於餐點，也可以是：
- 飲品
- 甜點
- 小吃
- 招牌套餐
- 咖啡
- 酒類
- 麵包
- 季節限定品項

價格註記：
價格、品項與匯率為 AI 根據公開資訊、店家類型、公開評論與一般市場價格進行合理推估，
僅供消費預算參考，
實際仍以店家現場菜單與即時匯率為準。

## 📦 外送資訊
目前尚未接入 Uber Eats / Foodpanda 即時資料。
請根據餐點類型與評論資料完整度，保守推估外送風險。

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