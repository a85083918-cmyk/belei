import { NextRequest, NextResponse } from "next/server";

const API_KEY = process.env.GOOGLE_PLACES_API_KEY;

const CITY_WORDS = ["台北", "臺北", "新北", "桃園", "台中", "臺中", "台南", "臺南", "高雄"];

const FOOD_TYPES = [
  "restaurant",
  "food",
  "meal_takeaway",
  "meal_delivery",
  "cafe",
  "bakery",
  "bar",
];

const BLOCK_TYPES = [
  "electronics_store",
  "gas_station",
  "local_government_office",
  "city_hall",
  "store",
  "shopping_mall",
  "supermarket",
  "convenience_store",
  "department_store",
  "car_repair",
  "car_dealer",
  "bank",
  "school",
  "hospital",
  "pharmacy",
  "lodging",
  "locality",
  "political",
  "point_of_interest",
];

function normalizeText(text = "") {
  return text.toLowerCase().replaceAll("臺", "台").replace(/\s/g, "").trim();
}

function getCityFromQuery(q: string): string | null {
  const query = normalizeText(q);

  if (query.includes("高雄")) return "高雄";
  if (query.includes("台中")) return "台中";
  if (query.includes("台南")) return "台南";
  if (query.includes("台北")) return "台北";
  if (query.includes("新北")) return "新北";
  if (query.includes("桃園")) return "桃園";

  return null;
}

function removeCityWords(q: string) {
  let result = q;

  CITY_WORDS.forEach((city) => {
    result = result.replaceAll(city, "");
    result = result.replaceAll(`${city}市`, "");
  });

  return result.trim();
}

function isFoodPlace(place: any) {
  const types: string[] = place.types || [];

  const hasFoodType = types.some((type) => FOOD_TYPES.includes(type));
  const hasBlockedType = types.some((type) => BLOCK_TYPES.includes(type));

  if (!hasFoodType) return false;
  if (hasBlockedType && !hasFoodType) return false;

  return true;
}

function isInRequestedCity(place: any, city: string | null) {
  if (!city) return true;

  const address = normalizeText(place.formattedAddress || place.address || "");
  return address.includes(normalizeText(city));
}

function isNameRelevant(place: any, query: string) {
  const placeName = normalizeText(place.displayName?.text || place.name || "");
  const cleanQuery = normalizeText(removeCityWords(query));

  if (!cleanQuery) return true;
  if (placeName.includes(cleanQuery)) return true;
  if (cleanQuery.includes(placeName)) return true;

  return false;
}

function dedupePlaces(places: any[]) {
  const seen = new Set<string>();

  return places.filter((place) => {
    if (!place.id) return false;
    if (seen.has(place.id)) return false;

    seen.add(place.id);
    return true;
  });
}

function withPhotoName(place: any) {
  const photoName = place.photos?.[0]?.name || null;

  return {
    id: place.id,
    name: place.displayName?.text || "未命名店家",
    address: place.formattedAddress || "",
    rating: place.rating ?? null,
    userRatingCount: place.userRatingCount ?? null,
    location: place.location ?? null,
    types: place.types || [],
    currentOpeningHours: place.currentOpeningHours ?? null,
    photoName,
    hasPhoto: Boolean(photoName),
  };
}

async function searchGooglePlaces(query: string, city: string | null) {
  if (!API_KEY) {
    throw new Error("Missing GOOGLE_PLACES_API_KEY");
  }

  const cleanQuery = removeCityWords(query);
  const searchQuery = city ? `${city} ${cleanQuery} 餐廳` : `${cleanQuery} 餐廳`;

  const res = await fetch("https://places.googleapis.com/v1/places:searchText", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": API_KEY,
      "X-Goog-FieldMask": [
        "places.id",
        "places.displayName",
        "places.formattedAddress",
        "places.rating",
        "places.userRatingCount",
        "places.location",
        "places.types",
        "places.currentOpeningHours",
        "places.photos",
      ].join(","),
    },
    body: JSON.stringify({
      textQuery: searchQuery,
      languageCode: "zh-TW",
      regionCode: "TW",
      includedType: "restaurant",
      maxResultCount: 12,
    }),
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error?.message || "Google Places API 搜尋失敗");
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

    const dedupedPlaces = dedupePlaces(rawPlaces);
    const foodPlaces = dedupedPlaces.filter(isFoodPlace);
    const cityFilteredPlaces = foodPlaces.filter((place) =>
      isInRequestedCity(place, requestedCity)
    );
    const relevantPlaces = cityFilteredPlaces.filter((place) =>
      isNameRelevant(place, q)
    );

    const finalPlaces = relevantPlaces.map(withPhotoName);

    const noCityMatch =
      Boolean(requestedCity) && foodPlaces.length > 0 && cityFilteredPlaces.length === 0;

    return NextResponse.json({
      places: finalPlaces,
      requestedCity,
      noCityMatch,
      message:
        finalPlaces.length === 0
          ? requestedCity
            ? `${removeCityWords(q)} 在 ${requestedCity} 可能沒有符合的餐飲分店`
            : "找不到符合的餐飲店家"
          : null,
      debug: {
        query: q,
        requestedCity,
        rawCount: rawPlaces.length,
        dedupedCount: dedupedPlaces.length,
        foodCount: foodPlaces.length,
        cityFilteredCount: cityFilteredPlaces.length,
        finalCount: finalPlaces.length,
        rawPreview: dedupedPlaces.slice(0, 5).map((place) => ({
          name: place.displayName?.text,
          address: place.formattedAddress,
          types: place.types,
        })),
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        places: [],
        requestedCity: null,
        noCityMatch: false,
        message: error.message || "搜尋失敗",
      },
      { status: 200 }
    );
  }
}