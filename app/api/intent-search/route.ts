import { NextRequest, NextResponse } from "next/server";

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

function getRiskScoreV2(place: any) {
  let score = 45;

  const rating = place?.rating || 0;
  const count = place?.userRatingCount || 0;
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

  if (openNow === false) score += 5;
  if (rating >= 4.7 && count < 100) score += 12;

  return Math.max(0, Math.min(Math.round(score), 100));
}

function getSafetyScore(place: any) {
  return 100 - getRiskScoreV2(place);
}

function formatPlace(place: any, userLat?: number, userLng?: number) {
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
      userLat && userLng && placeLat && placeLng
        ? getDistanceMeters(userLat, userLng, placeLat, placeLng)
        : null,
    photoName: place.photos?.[0]?.name || null,
    safetyScore: getSafetyScore(place),
  };
}

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;

  const q = searchParams.get("q") || "";
  const lat = Number(searchParams.get("lat"));
  const lng = Number(searchParams.get("lng"));

  if (!q.trim()) {
    return NextResponse.json({ error: "Missing query" }, { status: 400 });
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

  const origin = req.nextUrl.origin;

  const intentRes = await fetch(`${origin}/api/intent`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query: q }),
    cache: "no-store",
  });

  if (!intentRes.ok) {
    const text = await intentRes.text();
    console.error("Intent API failed:", text);

    return NextResponse.json(
      { error: "Intent API failed", detail: text },
      { status: 500 }
    );
  }

  const intent = await intentRes.json();

  const keyword = intent.keyword || q;
  const city = intent.city || searchParams.get("city") || "高雄";
  const reason = intent.reason || "";

  const searchQuery = `${city} ${keyword}`;

  const body: any = {
    textQuery: searchQuery,
    maxResultCount: 20,
    languageCode: "zh-TW",
    regionCode: "TW",
  };

  if (!Number.isNaN(lat) && !Number.isNaN(lng)) {
    body.locationBias = {
      circle: {
        center: {
          latitude: lat,
          longitude: lng,
        },
        radius: 8000,
      },
    };
  }

  const res = await fetch("https://places.googleapis.com/v1/places:searchText", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": apiKey,
      "X-Goog-FieldMask":
        "places.id,places.displayName,places.formattedAddress,places.location,places.rating,places.userRatingCount,places.currentOpeningHours,places.types,places.photos",
    },
    body: JSON.stringify(body),
    cache: "no-store",
  });

  if (!res.ok) {
    const text = await res.text();
    console.error("Intent search failed:", text);

    return NextResponse.json(
      { error: "Intent search failed", detail: text },
      { status: 500 }
    );
  }

  const data = await res.json();

  const results = (data.places || [])
    .map((place: any) => formatPlace(place, lat || undefined, lng || undefined))
    .filter((place: any) => place.safetyScore >= 60)
    .sort((a: any, b: any) => {
      if (b.safetyScore !== a.safetyScore) {
        return b.safetyScore - a.safetyScore;
      }

      return (a.distance ?? 999999) - (b.distance ?? 999999);
    })
    .slice(0, 10);

  return NextResponse.json({
    q,
    intent: {
      keyword,
      city,
      reason,
    },
    searchQuery,
    count: results.length,
    results,
  });
}