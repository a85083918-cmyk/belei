export type StoreItem = {
    name: string;
    query: string;
    subtitle: string;
    photoName?: string | null;
  };
  
  export type ApiStoreItem = {
    name: string;
    query: string;
    subtitle?: string;
    area?: string;
    reason?: string;
    risk?: string;
    strength?: string;
    photoName?: string | null;
  };
  
  export const hotSearches: StoreItem[] = [
    { name: "老新台菜", query: "老新台菜 高雄", subtitle: "被搜尋 6,215 次" },
    { name: "丹丹漢堡", query: "丹丹漢堡 高雄", subtitle: "被搜尋 4,992 次" },
    { name: "紅茶老爹", query: "紅茶老爹", subtitle: "被搜尋 4,201 次" },
    { name: "50嵐", query: "50嵐", subtitle: "被搜尋 3,890 次" },
    { name: "老四川", query: "老四川", subtitle: "被搜尋 3,210 次" },
  ];
  
  export const expectationGap: StoreItem[] = [
    { name: "老四川", query: "老四川", subtitle: "期待落差指數 92" },
    { name: "陶板屋", query: "陶板屋", subtitle: "期待落差指數 89" },
    { name: "王品牛排", query: "王品牛排", subtitle: "期待落差指數 87" },
  ];
  
  export const stableStores: StoreItem[] = [
    { name: "饗食天堂", query: "饗食天堂", subtitle: "穩定度 88%" },
    { name: "漢來海港", query: "漢來海港", subtitle: "穩定度 85%" },
    { name: "燒肉眾", query: "燒肉眾", subtitle: "穩定度 82%" },
  ];
  
  export const aiExamples = [
    "今天想吃麵",
    "附近火鍋",
    "高雄牛排",
    "適合約會",
    "300元內",
    "附近早餐",
    "安靜咖啡廳",
    "宵夜推薦",
  ];