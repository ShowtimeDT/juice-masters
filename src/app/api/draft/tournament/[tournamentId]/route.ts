import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ tournamentId: string }> }
) {
  const { tournamentId } = await params;
  const sql = getDb();

  try {
    const drafts = await sql`
      SELECT * FROM drafts WHERE tournament_id = ${tournamentId} ORDER BY created_at DESC LIMIT 1
    `;

    if (drafts.length === 0) {
      return NextResponse.json(null);
    }

    const draft = drafts[0];
    const draftId = draft.id;

    const tiers = await sql`
      SELECT * FROM draft_tiers WHERE draft_id = ${draftId} ORDER BY tier_number
    `;
    const golfers = await sql`
      SELECT * FROM draft_golfers WHERE draft_id = ${draftId} ORDER BY tier_number, name
    `;
    const picks = await sql`
      SELECT * FROM draft_picks WHERE draft_id = ${draftId} ORDER BY owner, tier_number
    `;
    const members = await sql`
      SELECT * FROM draft_members WHERE draft_id = ${draftId} ORDER BY name
    `;

    return NextResponse.json({ draft, tiers, golfers, picks, members });
  } catch (error) {
    console.error("Tournament draft error:", error);
    return NextResponse.json({ error: "Failed to fetch draft" }, { status: 500 });
  }
}
