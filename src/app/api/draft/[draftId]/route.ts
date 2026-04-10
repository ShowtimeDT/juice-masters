import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

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

    return NextResponse.json({
      draft,
      tiers,
      golfers,
      picks,
      members,
    });
  } catch (error) {
    console.error("Error fetching draft:", error);
    return NextResponse.json({ error: "Failed to fetch draft" }, { status: 500 });
  }
}
