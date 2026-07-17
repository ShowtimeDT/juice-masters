import { NextResponse } from "next/server";
import { getTournament, isTournamentId } from "@/lib/tournaments";

const ESPN_URL =
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

export async function GET(req: Request) {
  try {
    const t = new URL(req.url).searchParams.get("t");
    if (!isTournamentId(t)) {
      return NextResponse.json({ error: "Unknown tournament" }, { status: 400 });
    }
    const tournament = getTournament(t);
    if (!tournament.espnDatesParam) {
      // "season" has no ESPN scoreboard of its own.
      return NextResponse.json({ error: "Tournament has no scoreboard" }, { status: 400 });
    }
    const espnUrl = `${ESPN_URL}?dates=${tournament.espnDatesParam}`;

    // The scoreboard JSON grows past ~1.5MB once a round of hole-by-hole
    // scores exists. Next's fetch cache rejects entries over 2MB (the body is
    // stored base64-inflated) and silently keeps serving the last stored
    // snapshot — which froze live scoring during The Open 2026. Bypass the
    // data cache here; the CDN Cache-Control header on the response below is
    // what keeps ESPN traffic to ~1 request per minute.
    const res = await fetch(espnUrl, { cache: "no-store" });

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
