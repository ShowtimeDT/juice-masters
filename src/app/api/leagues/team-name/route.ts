import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { requireUser, authzError } from "@/lib/authz";
import { cleanName } from "@/lib/validate";

export async function POST(request: NextRequest) {
  const user = await requireUser();
  if (!user.ok) return authzError(user);

  const sql = getDb();

  try {
    const { league_id, team_name: rawTeamName } = await request.json();
    const teamName = cleanName(rawTeamName);
    if (!league_id || teamName === null) {
      return NextResponse.json(
        { error: "League ID and team name are required (max 120 chars)" },
        { status: 400 }
      );
    }

    // Only updates the caller's own membership row; 0 rows if they aren't a
    // member of that league.
    const updated = await sql`
      UPDATE league_members SET team_name = ${teamName}
      WHERE league_id = ${league_id} AND user_id = ${user.userId}
      RETURNING id
    `;
    if (updated.length === 0) {
      return NextResponse.json({ error: "You are not a member of this league" }, { status: 403 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Team name error:", error);
    return NextResponse.json({ error: "Failed to update team name" }, { status: 500 });
  }
}
