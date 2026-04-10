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
    const { inviteCode } = await request.json();
    if (!inviteCode?.trim()) {
      return NextResponse.json({ error: "Invite code is required" }, { status: 400 });
    }

    const [league] = await sql`SELECT * FROM leagues WHERE invite_code = ${inviteCode.trim()}`;
    if (!league) {
      return NextResponse.json({ error: "Invalid invite code" }, { status: 404 });
    }

    // Check if already a member
    const [existing] = await sql`
      SELECT id FROM league_members WHERE league_id = ${league.id} AND user_id = ${session.user.id}
    `;
    if (existing) {
      return NextResponse.json({ league, alreadyMember: true });
    }

    // Add as member
    await sql`
      INSERT INTO league_members (league_id, user_id, display_name)
      VALUES (${league.id}, ${session.user.id}, ${session.user.name || 'Unknown'})
    `;

    return NextResponse.json({ league, joined: true });
  } catch (error) {
    console.error("Join league error:", error);
    return NextResponse.json({ error: "Failed to join league" }, { status: 500 });
  }
}
