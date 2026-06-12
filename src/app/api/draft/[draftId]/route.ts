import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { canViewLeagueById } from "@/lib/authz";
import { auth } from "@/lib/auth";
import { isPastDeadline } from "@/lib/draft/deadline";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ draftId: string }> }
) {
  const { draftId } = await params;
  const sql = getDb();

  try {
    const [draft] = await sql`SELECT * FROM drafts WHERE id = ${draftId}`;
    if (!draft) {
      return NextResponse.json({ error: "Draft not found" }, { status: 404 });
    }

    // Private leagues hide their drafts from outsiders.
    if (draft.league_id && !(await canViewLeagueById(draft.league_id as string))) {
      return NextResponse.json({ error: "This league is private", private: true }, { status: 403 });
    }

    // Auto-lock if the deadline has passed.
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
    const members = await sql`
      SELECT * FROM draft_members WHERE draft_id = ${draftId} ORDER BY name
    `;

    // Pick privacy: everyone's picks only after lock or for the commissioner;
    // otherwise callers see only their own.
    const session = await auth();
    const userId = session?.user?.id ?? null;

    let isCommissioner = false;
    if (userId && draft.league_id) {
      const [league] = await sql`SELECT commissioner_id FROM leagues WHERE id = ${draft.league_id}`;
      isCommissioner = league?.commissioner_id === userId;
    }

    let picks: Record<string, unknown>[];
    if (draft.status === "locked" || isCommissioner) {
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

    return NextResponse.json({ draft, tiers, golfers, picks, members });
  } catch (error) {
    console.error("Error fetching draft:", error);
    return NextResponse.json({ error: "Failed to fetch draft" }, { status: 500 });
  }
}
