import { NextRequest, NextResponse } from "next/server";

const CATEGORY_TYPES: Record<string, string[]> = {
  restaurant: ["restaurant"],
  cafe: ["cafe"],
  dessert: ["bakery"],
  bar: ["bar"],
  takeaway: ["meal_takeaway"],
  delivery: ["meal_delivery"],
  all: ["restaurant", "cafe", "bakery", "bar", "meal_takeaway", "meal_delivery"],
};

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
  "clothing_store",
  "shoe_store",
  "book_store",
  "electronics_store",
  "furniture_store",
  "hardware_store",
  "pet_store",
  "liquor_store",

  "city_hall",
  "courthouse",
  "local_government_office",
  "police",
  "fire_station",
  "post_office",
  "embassy",

  "bank",
  "atm",
  "insurance_agency",
  "accounting",

  "hospital",
  "doctor",
  "dentist",
  "pharmacy",
  "physiotherapist",
  "veterinary_care",

  "school",
  "primary_school",
  "secondary_school",
  "university",
  "library",

  "office",
  "real_estate_agency",
  "travel_agency",
  "employment_agency",

  "gas_station",
  "parking",
  "bus_station",
  "subway_station",
  "train_station",
  "airport",
  "taxi_stand",
  "transit_station",

  "lodging",
  "rv_park",
  "campground",

  "museum",
  "movie_theater",
  "tourist_attraction",
  "amusement_park",
  "art_gallery",
  "casino",
  "stadium",
  "park",
  "zoo",
  "aquarium",

  "church",
  "hindu_temple",
  "mosque",
  "synagogue",

  "beauty_salon",
  "spa",
  "gym",
  "laundry",
  "car_wash",
  "car_repair",
  "car_rental",
];

const BLOCK_KEYWORDS = [
  "百貨",
  "購物中心",
  "商場",
  "商辦",
  "辦公室",
  "停車場",
  "市政府",
  "區公所",
  "戶政",
  "地政",
  "銀行",
  "郵局",
  "加油站",
  "醫院",
  "診所",
  "牙醫",
  "藥局",
  "學校",
  "國小",
  "國中",
  "高中",
  "大學",
  "補習班",
  "圖書館",
  "車站",
  "捷運站",
  "機場",
  "旅館",
  "飯店",
  "酒店",
  "汽車旅館",
  "服務中心",
  "展示中心",
  "售樓中心",
  "代銷",
  "房仲",
  "健身房",
  "美容",
  "美甲",
  "按摩",
  "洗衣",
  "診所",
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

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const lat = Number(searchParams.get("lat"));
  const lng = Number(searchParams.get("lng"));
  const category = searchParams.get("category") || "all";

  if (!lat || !lng) {
    return NextResponse.json({ error: "Missing lat or lng" }, { status: 400 });
  }

  const includedTypes = CATEGORY_TYPES[category] || CATEGORY_TYPES.all;

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

  const res = await fetch("https://places.googleapis.com/v1/places:searchNearby", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": apiKey,
      "X-Goog-FieldMask":
        "places.id,places.displayName,places.formattedAddress,places.location,places.rating,places.userRatingCount,places.currentOpeningHours,places.types,places.photos",
    },
    body: JSON.stringify({
      includedTypes,
      maxResultCount: 20,
      rankPreference: "DISTANCE",
      locationRestriction: {
        circle: {
          center: {
            latitude: lat,
            longitude: lng,
          },
          radius: 800,
        },
      },
      languageCode: "zh-TW",
    }),
    cache: "no-store",
  });

  if (!res.ok) {
    const text = await res.text();
    console.error("Nearby Search failed:", text);

    return NextResponse.json(
      { error: "Nearby Search failed", detail: text },
      { status: 500 }
    );
  }

  const data = await res.json();

  const places = (data.places || [])
    .filter(isFoodPlace)
    .map((place: any) => {
      const placeLat = place.location?.latitude;
      const placeLng = place.location?.longitude;

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
          placeLat && placeLng
            ? getDistanceMeters(lat, lng, placeLat, placeLng)
            : null,
        photoName: place.photos?.[0]?.name || null,
        types: place.types || [],
      };
    });

  return NextResponse.json({
    category,
    places,
  });
}