import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { requireLeagueCommissioner, authzError } from "@/lib/authz";

/**
 * Commissioner safety net for member claiming: unlink a member slot
 * (user_id = null) so the right person can claim it instead.
 */
export async function POST(request: NextRequest) {
  const sql = getDb();

  try {
    const { league_id, member_id } = await request.json();
    if (!league_id || member_id == null) {
      return NextResponse.json(
        { error: "league_id and member_id are required" },
        { status: 400 }
      );
    }

    const authz = await requireLeagueCommissioner(league_id);
    if (!authz.ok) return authzError(authz);

    const updated = await sql`
      UPDATE league_members SET user_id = NULL
      WHERE id = ${member_id} AND league_id = ${league_id}
      RETURNING id, display_name
    `;
    if (updated.length === 0) {
      return NextResponse.json({ error: "Member not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, member: updated[0] });
  } catch (error) {
    console.error("Member link error:", error);
    return NextResponse.json({ error: "Failed to update member" }, { status: 500 });
  }
}
