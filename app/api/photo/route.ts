import { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const photoName = searchParams.get("name");

  if (!photoName) {
    return new Response("Missing photo name", { status: 400 });
  }

  const apiKey = process.env.GOOGLE_PLACES_API_KEY;

  const url = `https://places.googleapis.com/v1/${photoName}/media?maxWidthPx=600&key=${apiKey}`;

  const response = await fetch(url, {
    redirect: "follow",
  });

  return new Response(response.body, {
    headers: {
      "Content-Type": response.headers.get("Content-Type") || "image/jpeg",
      "Cache-Control": "public, max-age=86400",
    },
  });
}