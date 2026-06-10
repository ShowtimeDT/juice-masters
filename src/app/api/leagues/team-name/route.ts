import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getDb } from "@/lib/db";

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const sql = getDb();

  try {
    const { league_id, team_name } = await request.json();

    if (!league_id || !team_name?.trim()) {
      return NextResponse.json({ error: "League ID and team name are required" }, { status: 400 });
    }

    await sql`
      UPDATE league_members SET team_name = ${team_name.trim()}
      WHERE league_id = ${league_id} AND user_id = ${session.user.id}
    `;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Team name error:", error);
    return NextResponse.json({ error: "Failed to update team name" }, { status: 500 });
  }
}
