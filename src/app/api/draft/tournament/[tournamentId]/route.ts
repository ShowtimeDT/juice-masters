import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { TOURNAMENTS } from "@/lib/tournaments";

const LOCK_MINUTES_BEFORE = 15;

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ tournamentId: string }> }
) {
  const { tournamentId } = await params;
  const leagueId = request.nextUrl.searchParams.get("league_id");
  const sql = getDb();

  try {
    let drafts;
    if (leagueId) {
      drafts = await sql`
        SELECT * FROM drafts WHERE tournament_id = ${tournamentId} AND league_id = ${leagueId} ORDER BY created_at DESC LIMIT 1
      `;
    } else {
      // Backward compat: drafts without a league_id (old mock data)
      drafts = await sql`
        SELECT * FROM drafts WHERE tournament_id = ${tournamentId} AND league_id IS NULL ORDER BY created_at DESC LIMIT 1
      `;
    }

    if (drafts.length === 0) {
      return NextResponse.json(null);
    }

    const draft = drafts[0];
    const draftId = draft.id as string;

    // Check if draft should auto-lock
    if (draft.status === "open") {
      const tournament = TOURNAMENTS.find((t) => t.id === tournamentId);
      if (tournament?.firstTeeTime) {
        const deadline = new Date(tournament.firstTeeTime);
        deadline.setMinutes(deadline.getMinutes() - LOCK_MINUTES_BEFORE);
        if (new Date() >= deadline) {
          await sql`UPDATE drafts SET status = 'locked' WHERE id = ${draftId}`;
          draft.status = "locked";
        }
      }
    }

    const tiers = await sql`
      SELECT * FROM draft_tiers WHERE draft_id = ${draftId} ORDER BY tier_number
    `;
    const golfers = await sql`
      SELECT * FROM draft_golfers WHERE draft_id = ${draftId} ORDER BY tier_number, name
    `;
    const members = await sql`
      SELECT * FROM draft_members WHERE draft_id = ${draftId} ORDER BY name
    `;

    // Only return the requesting user's picks when draft is open/closed
    const owner = request.nextUrl.searchParams.get("owner");
    let picks: Record<string, unknown>[];

    if (draft.status === "locked") {
      picks = await sql`
        SELECT * FROM draft_picks WHERE draft_id = ${draftId} ORDER BY owner, tier_number
      `;
    } else if (owner) {
      picks = await sql`
        SELECT * FROM draft_picks WHERE draft_id = ${draftId} AND owner = ${owner} ORDER BY tier_number
      `;
    } else {
      picks = [];
    }

    const pickCounts = await sql`
      SELECT owner, COUNT(*) as count FROM draft_picks WHERE draft_id = ${draftId} GROUP BY owner
    `;

    return NextResponse.json({ draft, tiers, golfers, picks, members, pickCounts });
  } catch (error) {
    console.error("Tournament draft error:", error);
    return NextResponse.json({ error: "Failed to fetch draft" }, { status: 500 });
  }
}
