import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { requireUser, authzError } from "@/lib/authz";

/**
 * Join a league by invite code. Pass claimMemberId to take over an
 * unclaimed historical member slot (display name + past results) instead
 * of joining as a brand-new member.
 */
export async function POST(request: NextRequest) {
  const user = await requireUser();
  if (!user.ok) return authzError(user);

  const sql = getDb();

  try {
    const { inviteCode, claimMemberId } = await request.json();
    if (!inviteCode?.trim()) {
      return NextResponse.json({ error: "Invite code is required" }, { status: 400 });
    }

    const [league] = await sql`SELECT * FROM leagues WHERE invite_code = ${inviteCode.trim()}`;
    if (!league) {
      return NextResponse.json({ error: "Invalid invite code" }, { status: 404 });
    }

    // Already a member?
    const [existing] = await sql`
      SELECT id FROM league_members WHERE league_id = ${league.id} AND user_id = ${user.userId}
    `;
    if (existing) {
      return NextResponse.json({ league, alreadyMember: true });
    }

    // Claim an unclaimed historical slot — atomic, first claim wins.
    if (claimMemberId != null) {
      const claimed = await sql`
        UPDATE league_members SET user_id = ${user.userId}
        WHERE id = ${claimMemberId} AND league_id = ${league.id} AND user_id IS NULL
        RETURNING id, display_name
      `;
      if (claimed.length === 0) {
        return NextResponse.json(
          { error: "That member has already been claimed" },
          { status: 409 }
        );
      }
      return NextResponse.json({ league, joined: true, claimed: claimed[0].display_name });
    }

    // Join as a new member.
    const [profile] = await sql`SELECT username, name FROM users WHERE id = ${user.userId}`;
    const displayName = (profile?.name as string) || "Unknown";
    const defaultTeamName = `${profile?.username || displayName}'s Team`;
    await sql`
      INSERT INTO league_members (league_id, user_id, display_name, team_name)
      VALUES (${league.id}, ${user.userId}, ${displayName}, ${defaultTeamName})
    `;

    return NextResponse.json({ league, joined: true });
  } catch (error) {
    console.error("Join league error:", error);
    return NextResponse.json({ error: "Failed to join league" }, { status: 500 });
  }
}
