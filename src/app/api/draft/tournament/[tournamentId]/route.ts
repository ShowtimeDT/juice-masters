import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { auth } from "@/lib/auth";
import { canViewLeagueById } from "@/lib/authz";
import { isPastDeadline } from "@/lib/draft/deadline";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ tournamentId: string }> }
) {
  const { tournamentId } = await params;
  const leagueId = request.nextUrl.searchParams.get("league_id");
  const sql = getDb();

  try {
    // Private leagues hide their drafts/standings from outsiders.
    if (leagueId && !(await canViewLeagueById(leagueId))) {
      return NextResponse.json({ error: "This league is private", private: true }, { status: 403 });
    }

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

    // Don't return pending drafts to non-commissioners
    if (draft.status === "pending") {
      return NextResponse.json(null);
    }

    // Auto-lock when the deadline (close_time, else tee-time) has passed.
    if (draft.status === "open" && isPastDeadline(draft)) {
      await sql`UPDATE drafts SET status = 'locked' WHERE id = ${draftId}`;
      draft.status = "locked";
    }

    const tiers = await sql`
      SELECT * FROM draft_tiers WHERE draft_id = ${draftId} ORDER BY tier_number
    `;
    const golfers = await sql`
      SELECT * FROM draft_golfers WHERE draft_id = ${draftId} ORDER BY tier_number, name
    `;
    // Draft membership follows league membership, so people who join the
    // league after the draft was created can still pick. draft_members is
    // only the fallback for old drafts that predate leagues.
    let members;
    if (draft.league_id) {
      members = await sql`
        SELECT display_name AS name, user_id FROM league_members
        WHERE league_id = ${draft.league_id} ORDER BY display_name
      `;
    } else {
      members = await sql`
        SELECT * FROM draft_members WHERE draft_id = ${draftId} ORDER BY name
      `;
    }

    // Before lock, callers only ever see their own picks — identity comes
    // from the session, never a query param.
    const session = await auth();
    const userId = session?.user?.id ?? null;

    let picks: Record<string, unknown>[];
    if (draft.status === "locked") {
      picks = await sql`
        SELECT * FROM draft_picks WHERE draft_id = ${draftId} ORDER BY owner, tier_number
      `;
    } else if (userId) {
      picks = await sql`
        SELECT * FROM draft_picks WHERE draft_id = ${draftId} AND user_id = ${userId} ORDER BY tier_number
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
