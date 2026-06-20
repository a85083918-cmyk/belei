import { NextResponse } from "next/server";

const FOOD_PLACE_TYPES = [
  "restaurant",
  "food",
  "cafe",
  "bakery",
  "meal_takeaway",
  "meal_delivery",
  "bar",
];

const CITY_LOCATION: Record<
  string,
  { aliases: string[]; latitude: number; longitude: number; radius: number }
> = {
  台北市: {
    aliases: ["台北", "台北市", "臺北", "臺北市"],
    latitude: 25.033964,
    longitude: 121.564468,
    radius: 25000,
  },
  新北市: {
    aliases: ["新北", "新北市"],
    latitude: 25.016983,
    longitude: 121.462786,
    radius: 35000,
  },
  桃園市: {
    aliases: ["桃園", "桃園市"],
    latitude: 24.993628,
    longitude: 121.300979,
    radius: 30000,
  },
  台中市: {
    aliases: ["台中", "台中市", "臺中", "臺中市"],
    latitude: 24.147736,
    longitude: 120.673648,
    radius: 35000,
  },
  台南市: {
    aliases: ["台南", "台南市", "臺南", "臺南市"],
    latitude: 22.999728,
    longitude: 120.227028,
    radius: 35000,
  },
  高雄市: {
    aliases: ["高雄", "高雄市"],
    latitude: 22.627278,
    longitude: 120.301435,
    radius: 40000,
  },
};

function getCityFromQuery(query: string) {
  return Object.keys(CITY_LOCATION).find((city) =>
    CITY_LOCATION[city].aliases.some((alias) => query.includes(alias))
  );
}

function removeCityWords(text: string) {
  return text
    .replace(
      /台北市|臺北市|台北|臺北|新北市|新北|桃園市|桃園|台中市|臺中市|台中|臺中|台南市|臺南市|台南|臺南|高雄市|高雄/g,
      ""
    )
    .trim();
}

function normalizeText(text: string) {
  return text
    .replace(/\s/g, "")
    .replace(/台/g, "臺")
    .replace(/[｜|()（）\-－_]/g, "")
    .toLowerCase();
}

function isFoodPlace(place: any) {
  const types: string[] = place.types || [];
  return types.some((type) => FOOD_PLACE_TYPES.includes(type));
}

function isInRequestedCity(place: any, city?: string) {
  if (!city) return true;

  const address = place.formattedAddress || "";
  const aliases = CITY_LOCATION[city].aliases;

  return aliases.some((alias) => address.includes(alias));
}

function isNameRelevant(place: any, query: string) {
  const rawQuery = removeCityWords(query);
  const q = normalizeText(rawQuery);
  const name = normalizeText(place.displayName?.text || "");

  if (!q) return true;

  if (name.includes(q) || q.includes(name)) return true;

  const qChars = Array.from(new Set(q.split("")));
  const matched = qChars.filter((char) => name.includes(char));
  const ratio = matched.length / qChars.length;

  return ratio >= 0.75;
}

function dedupePlaces(places: any[]) {
  const map = new Map<string, any>();

  places.forEach((place) => {
    if (!place.id) return;
    if (!map.has(place.id)) {
      map.set(place.id, place);
    }
  });

  return Array.from(map.values());
}

function withPhotoName(place: any) {
  return {
    ...place,
    photoName: place.photos?.[0]?.name ?? null,
  };
}

async function searchGooglePlaces({
  query,
  city,
  apiKey,
}: {
  query: string;
  city?: string;
  apiKey?: string;
}) {
  const requestBody: any = {
    textQuery: query,
    languageCode: "zh-TW",
    regionCode: "TW",
  };

  if (city) {
    const cityLocation = CITY_LOCATION[city];

    requestBody.locationBias = {
      circle: {
        center: {
          latitude: cityLocation.latitude,
          longitude: cityLocation.longitude,
        },
        radius: cityLocation.radius,
      },
    };
  }

  const response = await fetch(
    "https://places.googleapis.com/v1/places:searchText",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": apiKey || "",
        "X-Goog-FieldMask":
          "places.id,places.displayName,places.formattedAddress,places.rating,places.userRatingCount,places.location,places.types,places.currentOpeningHours,places.photos",
      },
      body: JSON.stringify(requestBody),
    }
  );

  const data = await response.json();
  return data.places || [];
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q");

  if (!query) {
    return NextResponse.json({ error: "Missing query" }, { status: 400 });
  }

  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  const requestedCity = getCityFromQuery(query);
  const cleanQuery = removeCityWords(query);

  let rawPlaces: any[] = [];

  if (requestedCity) {
    rawPlaces = await searchGooglePlaces({
      query,
      city: requestedCity,
      apiKey,
    });
  } else {
    const cityResults = await Promise.all(
      Object.keys(CITY_LOCATION).map((city) =>
        searchGooglePlaces({
          query: `${cleanQuery} ${city}`,
          city,
          apiKey,
        })
      )
    );

    rawPlaces = cityResults.flat();
  }

  const filteredPlaces = dedupePlaces(rawPlaces)
    .filter(isFoodPlace)
    .filter((place: any) => isInRequestedCity(place, requestedCity))
    .filter((place: any) => isNameRelevant(place, query))
    .map(withPhotoName);

  const noCityMatch = Boolean(requestedCity && filteredPlaces.length === 0);

  return NextResponse.json({
    places: filteredPlaces,
    requestedCity: requestedCity ?? null,
    noCityMatch,
    message: noCityMatch
      ? `${cleanQuery || query} 在 ${requestedCity} 可能沒有符合的餐飲分店，建議改查其他城市或確認店名。`
      : null,
  });
}