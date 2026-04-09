import { NextResponse } from "next/server";

const ESPN_URL =
  "https://site.api.espn.com/apis/site/v2/sports/golf/pga/scoreboard";

export async function GET() {
  try {
    const res = await fetch(ESPN_URL, {
      next: { revalidate: 60 },
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: "Failed to fetch from ESPN" },
        { status: res.status }
      );
    }

    const data = await res.json();
    return NextResponse.json(data, {
      headers: {
        "Cache-Control": "public, max-age=60, stale-while-revalidate=30",
      },
    });
  } catch {
    return NextResponse.json(
      { error: "ESPN API unavailable" },
      { status: 502 }
    );
  }
}
