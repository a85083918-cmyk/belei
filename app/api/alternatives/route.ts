import { NextRequest, NextResponse } from "next/server";

const ALLOWED_TYPES = [
  "restaurant",
  "cafe",
  "bakery",
  "bar",
  "meal_takeaway",
  "meal_delivery",
];

const BLOCK_TYPES = [
  "shopping_mall",
  "department_store",
  "supermarket",
  "convenience_store",
  "store",
  "electronics_store",
  "gas_station",
  "parking",
  "bank",
  "atm",
  "hospital",
  "doctor",
  "dentist",
  "pharmacy",
  "school",
  "university",
  "library",
  "lodging",
  "tourist_attraction",
  "movie_theater",
  "museum",
  "park",
  "gym",
  "beauty_salon",
  "spa",
  "car_repair",
  "car_wash",
];

const BLOCK_KEYWORDS = [
  "百貨",
  "購物中心",
  "商場",
  "停車場",
  "市政府",
  "區公所",
  "銀行",
  "郵局",
  "加油站",
  "醫院",
  "診所",
  "牙醫",
  "藥局",
  "學校",
  "大學",
  "圖書館",
  "車站",
  "捷運站",
  "旅館",
  "飯店",
  "健身房",
  "美容",
  "洗衣",
];

function getDistanceMeters(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
) {
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);

  return Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}

function isFoodPlace(place: any) {
  const types: string[] = place.types || [];
  const name = place.displayName?.text || "";

  const hasAllowedType = types.some((type) => ALLOWED_TYPES.includes(type));
  const hasBlockedType = types.some((type) => BLOCK_TYPES.includes(type));
  const hasBlockedKeyword = BLOCK_KEYWORDS.some((keyword) =>
    name.includes(keyword)
  );

  return hasAllowedType && !hasBlockedType && !hasBlockedKeyword;
}

function getSimpleRiskScore(place: any) {
  let score = 50;

  const rating = place.rating || 0;
  const count = place.userRatingCount || 0;

  if (rating >= 4.6) score -= 15;
  else if (rating >= 4.3) score -= 8;
  else if (rating < 3.8) score += 18;
  else if (rating < 4.1) score += 8;

  if (count >= 1000) score -= 8;
  else if (count >= 300) score -= 5;
  else if (count < 30) score += 12;
  else if (count < 100) score += 6;

  return Math.max(0, Math.min(score, 100));
}

function getSafetyScore(place: any) {
  return 100 - getSimpleRiskScore(place);
}

function formatPlace(place: any, lat: number, lng: number) {
  const placeLat = place.location?.latitude;
  const placeLng = place.location?.longitude;
  const safetyScore = getSafetyScore(place);

  return {
    placeId: place.id,
    name: place.displayName?.text || "未命名餐廳",
    address: place.formattedAddress || "",
    rating: place.rating || null,
    userRatingCount: place.userRatingCount || 0,
    openNow: place.currentOpeningHours?.openNow ?? null,
    latitude: placeLat ?? null,
    longitude: placeLng ?? null,
    distance:
      placeLat && placeLng ? getDistanceMeters(lat, lng, placeLat, placeLng) : null,
    photoName: place.photos?.[0]?.name || null,
    types: place.types || [],
    safetyScore,
  };
}

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;

  const lat = Number(searchParams.get("lat"));
  const lng = Number(searchParams.get("lng"));
  const keyword = searchParams.get("keyword") || "";
  const currentPlaceId = searchParams.get("currentPlaceId") || "";

  if (!lat || !lng) {
    return NextResponse.json(
      { error: "Missing lat or lng" },
      { status: 400 }
    );
  }

  if (!keyword.trim()) {
    return NextResponse.json(
      { error: "Missing keyword" },
      { status: 400 }
    );
  }

  const apiKey =
    process.env.GOOGLE_PLACES_API_KEY ||
    process.env.GOOGLE_MAPS_API_KEY ||
    process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      { error: "Missing Google Places API key" },
      { status: 500 }
    );
  }

  const res = await fetch("https://places.googleapis.com/v1/places:searchText", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": apiKey,
      "X-Goog-FieldMask":
        "places.id,places.displayName,places.formattedAddress,places.location,places.rating,places.userRatingCount,places.currentOpeningHours,places.types,places.photos",
    },
    body: JSON.stringify({
      textQuery: `${keyword} 餐廳`,
      maxResultCount: 20,
      locationBias: {
        circle: {
          center: {
            latitude: lat,
            longitude: lng,
          },
          radius: 5000,
        },
      },
      languageCode: "zh-TW",
    }),
    cache: "no-store",
  });

  if (!res.ok) {
    const text = await res.text();
    console.error("Alternatives Search failed:", text);

    return NextResponse.json(
      { error: "Alternatives Search failed", detail: text },
      { status: 500 }
    );
  }

  const data = await res.json();

  const alternatives = (data.places || [])
    .filter(isFoodPlace)
    .filter((place: any) => place.id !== currentPlaceId)
    .map((place: any) => formatPlace(place, lat, lng))
    .filter((place: any) => place.safetyScore >= 60)
    .sort((a: any, b: any) => {
      if (b.safetyScore !== a.safetyScore) {
        return b.safetyScore - a.safetyScore;
      }

      return (a.distance ?? 999999) - (b.distance ?? 999999);
    })
    .slice(0, 3);

  return NextResponse.json({
    keyword,
    currentPlaceId,
    alternatives,
  });
}