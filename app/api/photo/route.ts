import { NextRequest, NextResponse } from "next/server";

const API_KEY = process.env.GOOGLE_PLACES_API_KEY;

export async function GET(req: NextRequest) {
  try {
    const photoName = req.nextUrl.searchParams.get("name");
    const width = req.nextUrl.searchParams.get("w") || "800";

    if (!API_KEY) {
      return new Response("Missing GOOGLE_PLACES_API_KEY", { status: 500 });
    }

    if (!photoName) {
      return new Response("Missing photo name", { status: 400 });
    }

    const mediaUrl = `https://places.googleapis.com/v1/${photoName}/media?maxWidthPx=${width}&skipHttpRedirect=true`;

    const res = await fetch(mediaUrl, {
      headers: {
        "X-Goog-Api-Key": API_KEY,
      },
      cache: "no-store",
    });

    const data = await res.json();

    if (!res.ok || !data.photoUri) {
      console.error("Photo API error:", data);
      return new Response("Photo not found", { status: 404 });
    }

    return NextResponse.redirect(data.photoUri, 302);
  } catch (error) {
    console.error("/api/photo error:", error);
    return new Response("Photo API error", { status: 500 });
  }
}