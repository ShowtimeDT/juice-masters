import { NextRequest, NextResponse } from "next/server";

const ESPN_BASE =
  "https://site.api.espn.com/apis/site/v2/sports/golf/pga/scoreboard";

const ESPN_CORE_EVENT =
  "http://sports.core.api.espn.com/v2/sports/golf/leagues/pga/events";

// Module-scoped cache: eventId -> tournament metadata $ref. The mapping is
// effectively immutable for an event, so it survives across requests within
// the running server process.
const TOURNAMENT_REF_CACHE = new Map<string, string>();

/* eslint-disable @typescript-eslint/no-explicit-any */
async function attachTournamentMeta(data: any): Promise<void> {
  const event = data?.events?.[0];
  const eventId: string | undefined = event?.id;
  if (!event || !eventId) return;

  let tournamentRef = TOURNAMENT_REF_CACHE.get(eventId);
  if (!tournamentRef) {
    const evRes = await fetch(`${ESPN_CORE_EVENT}/${eventId}`, {
      next: { revalidate: 3600 },
    });
    if (!evRes.ok) return;
    const evData = await evRes.json();
    tournamentRef = evData?.tournament?.$ref;
    if (!tournamentRef) return;
    TOURNAMENT_REF_CACHE.set(eventId, tournamentRef);
  }

  const metaRes = await fetch(tournamentRef, { next: { revalidate: 60 } });
  if (!metaRes.ok) return;
  const meta = await metaRes.json();

  event.tournamentMeta = {
    currentRound: meta.currentRound,
    cutRound: meta.cutRound,
    cutScore: meta.cutScore,
    cutCount: meta.cutCount,
    numberOfRounds: meta.numberOfRounds,
  };
}
/* eslint-enable @typescript-eslint/no-explicit-any */

export async function GET(request: NextRequest) {
  try {
    const dates = request.nextUrl.searchParams.get("dates");
    const url = dates ? `${ESPN_BASE}?dates=${dates}` : ESPN_BASE;

    const res = await fetch(url, {
      next: { revalidate: 60 },
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: "Failed to fetch from ESPN" },
        { status: res.status }
      );
    }

    const data = await res.json();

    // Augment with cut info from the core API. Failure here is non-fatal —
    // the leaderboard still renders, just without missed-cut detection.
    try {
      await attachTournamentMeta(data);
    } catch {
      // swallow
    }

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
