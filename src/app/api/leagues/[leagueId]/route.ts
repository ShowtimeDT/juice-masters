import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ leagueId: string }> }
) {
  const { leagueId } = await params;
  const sql = getDb();

  try {
    // Support lookup by slug or id
    const [league] = await sql`
      SELECT * FROM leagues WHERE slug = ${leagueId} OR id::text = ${leagueId}
    `;
    if (!league) {
      return NextResponse.json({ error: "League not found" }, { status: 404 });
    }

    const members = await sql`
      SELECT lm.*, u.email, u.username FROM league_members lm
      JOIN users u ON u.id = lm.user_id
      WHERE lm.league_id = ${league.id}
      ORDER BY lm.joined_at
    `;

    return NextResponse.json({ league, members });
  } catch (error) {
    console.error("League error:", error);
    return NextResponse.json({ error: "Failed to fetch league" }, { status: 500 });
  }
}
