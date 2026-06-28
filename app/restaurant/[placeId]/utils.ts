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
  
  export function getRiskScore(place: any) {
    let score = 50;
  
    const rating = place?.rating || 0;
    const count = place?.userRatingCount || 0;
    const reviews = place?.reviews || [];
  
    if (rating >= 4.7) score -= 10;
    else if (rating >= 4.5) score -= 5;
    else if (rating < 3.5) score += 20;
    else if (rating < 4.0) score += 10;
  
    if (count >= 1000) score -= 8;
    else if (count >= 300) score -= 5;
    else if (count < 30) score += 12;
    else if (count < 100) score += 6;
  
    const lowStars = reviews.filter((r: any) => (r.rating || 5) <= 3).length;
    const ratio = reviews.length === 0 ? 0 : lowStars / reviews.length;
  
    if (ratio > 0.25) score += 20;
    else if (ratio > 0.15) score += 10;
  
    return Math.max(0, Math.min(score, 100));
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