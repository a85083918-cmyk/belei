import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const placeId = searchParams.get("placeId");

  if (!placeId) {
    return NextResponse.json({ error: "Missing placeId" }, { status: 400 });
  }

  const apiKey = process.env.GOOGLE_PLACES_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      { error: "Missing GOOGLE_PLACES_API_KEY" },
      { status: 500 }
    );
  }

  const response = await fetch(
    `https://places.googleapis.com/v1/places/${placeId}?languageCode=zh-TW`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": apiKey,
        "X-Goog-FieldMask":
          [
            "id",
            "displayName",
            "formattedAddress",
            "rating",
            "userRatingCount",
            "location",
            "types",
            "nationalPhoneNumber",
            "internationalPhoneNumber",
            "googleMapsUri",
            "websiteUri",
            "currentOpeningHours",
            "regularOpeningHours",
            "reviews",
            "photos",
          ].join(","),
      },
      cache: "no-store",
    }
  );

  const data = await response.json();

  if (!response.ok) {
    console.error("Place detail failed:", data);

    return NextResponse.json(
      {
        error: "Place detail failed",
        detail: data,
      },
      { status: response.status }
    );
  }

  return NextResponse.json(data);
}