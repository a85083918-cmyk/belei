import { NextRequest, NextResponse } from "next/server";

const API_KEY = process.env.GOOGLE_PLACES_API_KEY;

const CITY_WORDS = ["台北", "臺北", "新北", "桃園", "台中", "臺中", "台南", "臺南", "高雄"];

function getCityFromQuery(q: string): string | null {
  if (q.includes("高雄")) return "高雄";
  if (q.includes("台中") || q.includes("臺中")) return "台中";
  if (q.includes("台南") || q.includes("臺南")) return "台南";
  if (q.includes("台北") || q.includes("臺北")) return "台北";
  if (q.includes("新北")) return "新北";
  if (q.includes("桃園")) return "桃園";
  return null;
}

function removeCityWords(q: string) {
  let result = q;
  CITY_WORDS.forEach((city) => {
    result = result.replaceAll(city, "");
  });
  return result.trim();
}

function normalizeText(text = "") {
  return text
    .toLowerCase()
    .replace(/\s/g, "")
    .replace(/[()（）\-・·]/g, "")
    .replace(/臺/g, "台");
}

function isFoodPlace(place: any) {
  const types = place.types || [];
  return types.some((t: string) =>
    [
      "restaurant",
      "food",
      "meal_takeaway",
      "meal_delivery",
      "cafe",
      "bakery",
      "bar",
    ].includes(t)
  );
}

function isInRequestedCity(place: any, city: string | null) {
  if (!city) return true;
  const address = place.formattedAddress || "";
  return normalizeText(address).includes(normalizeText(city));
}

function isNameRelevant(place: any, query: string) {
  const placeName = normalizeText(place.displayName?.text || "");
  const cleanQuery = normalizeText(removeCityWords(query));

  if (!cleanQuery) return true;
  if (placeName.includes(cleanQuery)) return true;
  if (cleanQuery.includes(placeName)) return true;

  // 放寬：只要有 2 個以上連續字命中就先保留
  for (let i = 0; i < cleanQuery.length - 1; i++) {
    const part = cleanQuery.slice(i, i + 2);
    if (placeName.includes(part)) return true;
  }

  return false;
}

function dedupePlaces(places: any[]) {
  const seen = new Set();
  return places.filter((place) => {
    if (!place.id || seen.has(place.id)) return false;
    seen.add(place.id);
    return true;
  });
}

function withPhotoName(place: any) {
  return {
    id: place.id,
    name: place.displayName?.text || "未命名店家",
    address: place.formattedAddress || "",
    rating: place.rating ?? null,
    userRatingCount: place.userRatingCount ?? null,
    location: place.location ?? null,
    types: place.types || [],
    currentOpeningHours: place.currentOpeningHours ?? null,
    photoName: place.photos?.[0]?.name ?? null,
  };
}

async function searchGooglePlaces(query: string, city: string | null) {
  if (!API_KEY) {
    throw new Error("Missing GOOGLE_PLACES_API_KEY");
  }

  const searchText = city ? `${city} ${removeCityWords(query)} 餐廳` : `${query} 餐廳 台灣`;

  const res = await fetch("https://places.googleapis.com/v1/places:searchText", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": API_KEY,
      "X-Goog-FieldMask":
        "places.id,places.displayName,places.formattedAddress,places.rating,places.userRatingCount,places.location,places.types,places.currentOpeningHours,places.photos",
    },
    body: JSON.stringify({
      textQuery: searchText,
      languageCode: "zh-TW",
      regionCode: "TW",
      maxResultCount: 10,
    }),
    cache: "no-store",
  });

  const data = await res.json();

  if (!res.ok) {
    console.error("Google Places API error:", data);
    throw new Error(data?.error?.message || "Google Places API failed");
  }

  return data.places || [];
}

export async function GET(req: NextRequest) {
  try {
    const q = req.nextUrl.searchParams.get("q")?.trim();

    if (!q) {
      return NextResponse.json({
        places: [],
        requestedCity: null,
        noCityMatch: false,
        message: "Missing query",
      });
    }

    const requestedCity = getCityFromQuery(q);
    const rawPlaces = await searchGooglePlaces(q, requestedCity);

    const deduped = dedupePlaces(rawPlaces);

    // 第一階段先放寬：不要因為 food/name/city 任一條件太嚴就全砍
    let filteredPlaces = deduped
      .filter((place) => isInRequestedCity(place, requestedCity))
      .filter((place) => isNameRelevant(place, q));

    // 如果過濾後變空，就回退到 Google 原始結果
    if (filteredPlaces.length === 0) {
      filteredPlaces = deduped;
    }

    const places = filteredPlaces.map(withPhotoName);

    return NextResponse.json({
      places,
      requestedCity,
      noCityMatch: requestedCity ? places.length === 0 : false,
      message: places.length === 0 ? "Google 沒有找到符合結果" : null,
      debug: {
        query: q,
        rawCount: rawPlaces.length,
        dedupedCount: deduped.length,
        finalCount: places.length,
        rawPreview: rawPlaces.map((p: any) => ({
          name: p.displayName?.text,
          address: p.formattedAddress,
          types: p.types,
          hasPhoto: !!p.photos?.[0]?.name,
        })),
      },
    });
  } catch (error: any) {
    console.error("/api/search error:", error);

    return NextResponse.json(
      {
        places: [],
        requestedCity: null,
        noCityMatch: false,
        message: error.message || "Search API error",
      },
      { status: 500 }
    );
  }
}import { NextRequest, NextResponse } from "next/server";

const API_KEY = process.env.GOOGLE_PLACES_API_KEY;

const CITY_WORDS = ["台北", "臺北", "新北", "桃園", "台中", "臺中", "台南", "臺南", "高雄"];

function getCityFromQuery(q: string): string | null {
  if (q.includes("高雄")) return "高雄";
  if (q.includes("台中") || q.includes("臺中")) return "台中";
  if (q.includes("台南") || q.includes("臺南")) return "台南";
  if (q.includes("台北") || q.includes("臺北")) return "台北";
  if (q.includes("新北")) return "新北";
  if (q.includes("桃園")) return "桃園";
  return null;
}

function removeCityWords(q: string) {
  let result = q;
  CITY_WORDS.forEach((city) => {
    result = result.replaceAll(city, "");
  });
  return result.trim();
}

function normalizeText(text = "") {
  return text
    .toLowerCase()
    .replace(/\s/g, "")
    .replace(/[()（）\-・·]/g, "")
    .replace(/臺/g, "台");
}

function isFoodPlace(place: any) {
  const types = place.types || [];
  return types.some((t: string) =>
    [
      "restaurant",
      "food",
      "meal_takeaway",
      "meal_delivery",
      "cafe",
      "bakery",
      "bar",
    ].includes(t)
  );
}

function isInRequestedCity(place: any, city: string | null) {
  if (!city) return true;
  const address = place.formattedAddress || "";
  return normalizeText(address).includes(normalizeText(city));
}

function isNameRelevant(place: any, query: string) {
  const placeName = normalizeText(place.displayName?.text || "");
  const cleanQuery = normalizeText(removeCityWords(query));

  if (!cleanQuery) return true;
  if (placeName.includes(cleanQuery)) return true;
  if (cleanQuery.includes(placeName)) return true;

  // 放寬：只要有 2 個以上連續字命中就先保留
  for (let i = 0; i < cleanQuery.length - 1; i++) {
    const part = cleanQuery.slice(i, i + 2);
    if (placeName.includes(part)) return true;
  }

  return false;
}

function dedupePlaces(places: any[]) {
  const seen = new Set();
  return places.filter((place) => {
    if (!place.id || seen.has(place.id)) return false;
    seen.add(place.id);
    return true;
  });
}

function withPhotoName(place: any) {
  return {
    id: place.id,
    name: place.displayName?.text || "未命名店家",
    address: place.formattedAddress || "",
    rating: place.rating ?? null,
    userRatingCount: place.userRatingCount ?? null,
    location: place.location ?? null,
    types: place.types || [],
    currentOpeningHours: place.currentOpeningHours ?? null,
    photoName: place.photos?.[0]?.name ?? null,
  };
}

async function searchGooglePlaces(query: string, city: string | null) {
  if (!API_KEY) {
    throw new Error("Missing GOOGLE_PLACES_API_KEY");
  }

  const searchText = city ? `${city} ${removeCityWords(query)} 餐廳` : `${query} 餐廳 台灣`;

  const res = await fetch("https://places.googleapis.com/v1/places:searchText", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": API_KEY,
      "X-Goog-FieldMask":
        "places.id,places.displayName,places.formattedAddress,places.rating,places.userRatingCount,places.location,places.types,places.currentOpeningHours,places.photos",
    },
    body: JSON.stringify({
      textQuery: searchText,
      languageCode: "zh-TW",
      regionCode: "TW",
      maxResultCount: 10,
    }),
    cache: "no-store",
  });

  const data = await res.json();

  if (!res.ok) {
    console.error("Google Places API error:", data);
    throw new Error(data?.error?.message || "Google Places API failed");
  }

  return data.places || [];
}

export async function GET(req: NextRequest) {
  try {
    const q = req.nextUrl.searchParams.get("q")?.trim();

    if (!q) {
      return NextResponse.json({
        places: [],
        requestedCity: null,
        noCityMatch: false,
        message: "Missing query",
      });
    }

    const requestedCity = getCityFromQuery(q);
    const rawPlaces = await searchGooglePlaces(q, requestedCity);

    const deduped = dedupePlaces(rawPlaces);

    // 第一階段先放寬：不要因為 food/name/city 任一條件太嚴就全砍
    let filteredPlaces = deduped
      .filter((place) => isInRequestedCity(place, requestedCity))
      .filter((place) => isNameRelevant(place, q));

    // 如果過濾後變空，就回退到 Google 原始結果
    if (filteredPlaces.length === 0) {
      filteredPlaces = deduped;
    }

    const places = filteredPlaces.map(withPhotoName);

    return NextResponse.json({
      places,
      requestedCity,
      noCityMatch: requestedCity ? places.length === 0 : false,
      message: places.length === 0 ? "Google 沒有找到符合結果" : null,
      debug: {
        query: q,
        rawCount: rawPlaces.length,
        dedupedCount: deduped.length,
        finalCount: places.length,
        rawPreview: rawPlaces.map((p: any) => ({
          name: p.displayName?.text,
          address: p.formattedAddress,
          types: p.types,
          hasPhoto: !!p.photos?.[0]?.name,
        })),
      },
    });
  } catch (error: any) {
    console.error("/api/search error:", error);

    return NextResponse.json(
      {
        places: [],
        requestedCity: null,
        noCityMatch: false,
        message: error.message || "Search API error",
      },
      { status: 500 }
    );
  }
}