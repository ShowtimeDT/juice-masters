import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { isLeagueMemberOrCommissioner } from "@/lib/authz";

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

    // No emails; LEFT JOIN so unclaimed historical members still appear.
    const members = await sql`
      SELECT lm.id, lm.league_id, lm.user_id, lm.display_name, lm.team_name,
             lm.joined_at, u.username
      FROM league_members lm
      LEFT JOIN users u ON u.id = lm.user_id
      WHERE lm.league_id = ${league.id}
      ORDER BY lm.joined_at
    `;

    // The invite code is for members to share — don't hand it to strangers.
    if (!(await isLeagueMemberOrCommissioner(league.id as string))) {
      delete league.invite_code;
    }

    return NextResponse.json({ league, members });
  } catch (error) {
    console.error("League error:", error);
    return NextResponse.json({ error: "Failed to fetch league" }, { status: 500 });
  }
}
