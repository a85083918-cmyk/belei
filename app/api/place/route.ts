import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const placeId = searchParams.get("placeId");

  if (!placeId) {
    return NextResponse.json({ error: "Missing placeId" }, { status: 400 });
  }

  const apiKey = process.env.GOOGLE_PLACES_API_KEY;

  const response = await fetch(
    `https://places.googleapis.com/v1/places/${placeId}?languageCode=zh-TW`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": apiKey || "",
        "X-Goog-FieldMask":
          "id,displayName,formattedAddress,rating,userRatingCount,location,nationalPhoneNumber,googleMapsUri,websiteUri,currentOpeningHours,reviews",
      },
    }
  );

  const data = await response.json();

  return NextResponse.json(data);
}