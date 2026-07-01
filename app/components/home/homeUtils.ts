import type { ApiStoreItem, StoreItem } from "./homeData";

export function normalizeStores(items?: ApiStoreItem[]): StoreItem[] {
  if (!items || !Array.isArray(items)) return [];

  return items.map((item) => ({
    name: item.name,
    query: item.query,
    subtitle: item.subtitle || item.area || "餐廳",
    photoName: item.photoName ?? null,
  }));
}

export function normalizeSearchKeyword(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

export function getPhotoUrl(photoName?: string | null) {
  if (!photoName) return null;
  return `/api/photo?name=${encodeURIComponent(photoName)}&w=600`;
}

export function isIntentSearch(value: string) {
  const intentWords = [
    "今天",
    "想吃",
    "附近",
    "推薦",
    "有沒有",
    "不要雷",
    "不雷",
    "適合",
    "約會",
    "聚餐",
    "一個人",
    "便宜",
    "平價",
    "預算",
    "元內",
    "宵夜",
    "早餐",
    "午餐",
    "晚餐",
    "麵",
    "火鍋",
    "咖啡",
    "牛排",
    "燒肉",
    "便當",
    "拉麵",
    "咖哩",
    "咖哩飯",
    "丼飯",
    "炒飯",
    "滷肉飯",
    "魯肉飯",
    "肉燥飯",
    "壽司",
    "義大利麵",
    "韓式",
    "泰式",
  ];

  return intentWords.some((word) => value.includes(word));
}