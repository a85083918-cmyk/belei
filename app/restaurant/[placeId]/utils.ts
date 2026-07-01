export function getSection(report: string, title: string) {
  const regex = new RegExp(`## ${title}([\\s\\S]*?)(?=\\n## |$)`);
  const match = report.match(regex);
  return match ? match[1].trim() : "";
}

export function getFirstLine(text: string) {
  return text.split("\n").find((line) => line.trim()) || "";
}

export function getRestLines(text: string) {
  return text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .slice(1)
    .join("\n");
}

export function cleanVerdict(text: string) {
  return text.replace("【", "").replace("】", "").trim();
}

export function getConfidenceLevel(count: number) {
  if (count >= 1000) return { stars: "★★★★☆", title: "高信心" };
  if (count >= 300) return { stars: "★★★☆☆", title: "中高信心" };
  if (count >= 100) return { stars: "★★★☆☆", title: "中等信心" };
  if (count >= 30) return { stars: "★★☆☆☆", title: "資料有限" };
  return { stars: "★☆☆☆☆", title: "資料不足" };
}

const BAD_KEYWORDS = [
  "難吃",
  "失望",
  "踩雷",
  "不會再來",
  "態度差",
  "服務差",
  "等很久",
  "等太久",
  "冷掉",
  "漏單",
  "少送",
  "送錯",
  "變貴",
  "漲價",
  "份量少",
  "縮水",
  "油膩",
  "不新鮮",
  "雷",
];

const EXPECTATION_GAP_KEYWORDS = [
  "名過其實",
  "不值得",
  "過譽",
  "網美",
  "排隊",
  "價格偏高",
  "CP值低",
  "普通",
  "沒有想像中",
];

const DELIVERY_BAD_KEYWORDS = [
  "外送",
  "Uber",
  "ubereats",
  "Foodpanda",
  "熊貓",
  "冷掉",
  "漏單",
  "少送",
  "送錯",
  "包裝",
  "灑出來",
];

function countKeywordHits(text: string, keywords: string[]) {
  return keywords.reduce((total, keyword) => {
    return text.includes(keyword) ? total + 1 : total;
  }, 0);
}

export function getRiskScore(place: any) {
  let score = 45;

  const rating = place?.rating || 0;
  const count = place?.userRatingCount || 0;
  const reviews = place?.reviews || [];
  const openNow = place?.currentOpeningHours?.openNow;

  if (rating >= 4.8) score -= 18;
  else if (rating >= 4.6) score -= 14;
  else if (rating >= 4.3) score -= 8;
  else if (rating >= 4.0) score += 3;
  else if (rating >= 3.7) score += 12;
  else if (rating > 0) score += 22;
  else score += 18;

  if (count >= 3000) score -= 10;
  else if (count >= 1000) score -= 8;
  else if (count >= 300) score -= 4;
  else if (count >= 100) score += 2;
  else if (count >= 30) score += 8;
  else score += 16;

  if (openNow === false) {
    score += 5;
  }

  const reviewTexts = reviews
    .map((review: any) => {
      return [
        review.text?.text,
        review.originalText?.text,
        review.text,
        review.originalText,
      ]
        .filter(Boolean)
        .join(" ");
    })
    .join(" ");

  const lowStars = reviews.filter((review: any) => (review.rating || 5) <= 3)
    .length;
  const reviewCount = reviews.length;
  const lowStarRatio = reviewCount === 0 ? 0 : lowStars / reviewCount;

  if (reviewCount === 0) {
    score += 10;
  } else {
    if (lowStarRatio >= 0.35) score += 24;
    else if (lowStarRatio >= 0.25) score += 18;
    else if (lowStarRatio >= 0.15) score += 10;
    else if (lowStarRatio >= 0.08) score += 5;
  }

  const badHits = countKeywordHits(reviewTexts, BAD_KEYWORDS);
  const gapHits = countKeywordHits(reviewTexts, EXPECTATION_GAP_KEYWORDS);
  const deliveryHits = countKeywordHits(reviewTexts, DELIVERY_BAD_KEYWORDS);

  score += Math.min(badHits * 4, 24);
  score += Math.min(gapHits * 5, 20);
  score += Math.min(deliveryHits * 3, 15);

  if (rating >= 4.7 && count < 100) {
    score += 12;
  }

  if (rating >= 4.6 && lowStarRatio >= 0.2) {
    score += 12;
  }

  return Math.max(0, Math.min(Math.round(score), 100));
}

export function getRiskLevel(score: number) {
  if (score >= 80) return "非常穩定";
  if (score >= 60) return "相對穩定";
  if (score >= 40) return "建議觀察";
  return "高風險";
}

export function getDeliveryRisk(score: number) {
  if (score <= 20) return { emoji: "💥", title: "低風險" };
  if (score <= 40) return { emoji: "💥💥", title: "中低風險" };
  if (score <= 60) return { emoji: "💥💥💥", title: "中風險" };
  if (score <= 80) return { emoji: "💥💥💥💥", title: "高風險" };
  return { emoji: "💥💥💥💥💥", title: "極高風險" };
}

export function getVerdictBadge(text: string) {
  const cleanText = cleanVerdict(text);

  if (cleanText.includes("值得")) return "值得吃";
  if (cleanText.includes("順路")) return "順路可吃";
  if (cleanText.includes("不建議")) return "不建議專程";
  if (cleanText.includes("謹慎")) return "謹慎考慮";

  return cleanText || "需要觀望";
}

export function isTaiwanAddress(address?: string) {
  if (!address) return false;

  const keywords = [
    "台灣",
    "臺灣",
    "高雄",
    "台北",
    "臺北",
    "新北",
    "台中",
    "臺中",
    "台南",
    "臺南",
    "桃園",
    "新竹",
    "苗栗",
    "彰化",
    "南投",
    "雲林",
    "嘉義",
    "屏東",
    "宜蘭",
    "花蓮",
    "台東",
    "臺東",
    "澎湖",
    "金門",
    "馬祖",
  ];

  return keywords.some((keyword) => address.includes(keyword));
}