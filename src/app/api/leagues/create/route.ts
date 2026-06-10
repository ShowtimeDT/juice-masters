import { randomBytes } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { requireUser, authzError } from "@/lib/authz";

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function generateInviteCode(): string {
  return randomBytes(6).toString("base64url");
}

function randomSuffix(): string {
  return randomBytes(2).toString("hex");
}

export async function POST(request: NextRequest) {
  const user = await requireUser();
  if (!user.ok) return authzError(user);

  const sql = getDb();

  try {
    const { name } = await request.json();
    if (!name?.trim()) {
      return NextResponse.json({ error: "League name is required" }, { status: 400 });
    }

    const baseSlug = generateSlug(name) || "league";
    const inviteCode = generateInviteCode();

    // On slug collision, retry once with a random suffix instead of failing.
    let league;
    try {
      [league] = await sql`
        INSERT INTO leagues (name, slug, commissioner_id, invite_code)
        VALUES (${name.trim()}, ${baseSlug}, ${user.userId}, ${inviteCode})
        RETURNING *
      `;
    } catch {
      [league] = await sql`
        INSERT INTO leagues (name, slug, commissioner_id, invite_code)
        VALUES (${name.trim()}, ${`${baseSlug}-${randomSuffix()}`}, ${user.userId}, ${inviteCode})
        RETURNING *
      `;
    }

    // Auto-add the commissioner as a member.
    const [creator] = await sql`SELECT username, name FROM users WHERE id = ${user.userId}`;
    const displayName = (creator?.name as string) || "Unknown";
    const defaultTeamName = `${creator?.username || displayName}'s Team`;
    await sql`
      INSERT INTO league_members (league_id, user_id, display_name, team_name)
      VALUES (${league.id}, ${user.userId}, ${displayName}, ${defaultTeamName})
    `;

    return NextResponse.json(league);
  } catch (error) {
    console.error("Create league error:", error);
    return NextResponse.json({ error: "Failed to create league" }, { status: 500 });
  }
}
