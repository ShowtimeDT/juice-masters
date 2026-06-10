import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getDb } from "@/lib/db";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const sql = getDb();

  try {
    const leagues = await sql`
      SELECT l.*, lm.display_name,
        (l.commissioner_id = ${session.user.id}) as is_commissioner
      FROM leagues l
      JOIN league_members lm ON lm.league_id = l.id AND lm.user_id = ${session.user.id}
      ORDER BY l.created_at DESC
    `;

    return NextResponse.json(leagues);
  } catch (error) {
    console.error("My leagues error:", error);
    return NextResponse.json({ error: "Failed to fetch leagues" }, { status: 500 });
  }
}
