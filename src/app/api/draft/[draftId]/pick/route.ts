import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { TOURNAMENTS } from "@/lib/tournaments";

const LOCK_MINUTES_BEFORE = 15;

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ draftId: string }> }
) {
  const { draftId } = await params;
  const sql = getDb();

  try {
    const { owner, picks, tiebreaker_guess } = await request.json();

    // Verify draft is open
    const [draft] = await sql`SELECT * FROM drafts WHERE id = ${draftId}`;
    if (!draft || draft.status !== "open") {
      return NextResponse.json({ error: "Draft is not open for picks" }, { status: 400 });
    }

    // Check auto-lock deadline
    const tournament = TOURNAMENTS.find((t) => t.id === draft.tournament_id);
    if (tournament?.firstTeeTime) {
      const deadline = new Date(tournament.firstTeeTime);
      deadline.setMinutes(deadline.getMinutes() - LOCK_MINUTES_BEFORE);
      if (new Date() >= deadline) {
        // Auto-lock the draft
        await sql`UPDATE drafts SET status = 'locked' WHERE id = ${draftId}`;
        return NextResponse.json({ error: "Draft has been locked — the tournament is about to start" }, { status: 400 });
      }
    }

    // Delete existing picks for this owner
    await sql`DELETE FROM draft_picks WHERE draft_id = ${draftId} AND owner = ${owner}`;

    // Insert new picks
    for (const pick of picks) {
      await sql`
        INSERT INTO draft_picks (draft_id, owner, tier_number, golfer_name, tiebreaker_guess)
        VALUES (${draftId}, ${owner}, ${pick.tier_number}, ${pick.golfer_name}, ${tiebreaker_guess})
      `;
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Pick error:", error);
    return NextResponse.json({ error: "Failed to submit picks" }, { status: 500 });
  }
}
