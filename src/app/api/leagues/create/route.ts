import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getDb } from "@/lib/db";

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function generateInviteCode(): string {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let code = "";
  for (let i = 0; i < 8; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const sql = getDb();

  try {
    const { name } = await request.json();
    if (!name?.trim()) {
      return NextResponse.json({ error: "League name is required" }, { status: 400 });
    }

    const slug = generateSlug(name);
    const inviteCode = generateInviteCode();

    const [league] = await sql`
      INSERT INTO leagues (name, slug, commissioner_id, invite_code)
      VALUES (${name.trim()}, ${slug}, ${session.user.id}, ${inviteCode})
      RETURNING *
    `;

    // Get username for default team name
    const [user] = await sql`SELECT username, name FROM users WHERE id = ${session.user.id}`;
    const displayName = user?.name || session.user.name || "Unknown";
    const defaultTeamName = `${user?.username || displayName}'s Team`;

    // Auto-add commissioner as a member
    await sql`
      INSERT INTO league_members (league_id, user_id, display_name, team_name)
      VALUES (${league.id}, ${session.user.id}, ${displayName}, ${defaultTeamName})
    `;

    return NextResponse.json(league);
  } catch (error) {
    console.error("Create league error:", error);
    return NextResponse.json({ error: "Failed to create league. Name or slug may already exist." }, { status: 500 });
  }
}
