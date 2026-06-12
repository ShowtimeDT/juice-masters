import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getDb } from "@/lib/db";
import { requireUser, authzError } from "@/lib/authz";
import { leaguePasswordMatches } from "@/lib/league-password";

type DbRow = Record<string, unknown>;

/**
 * Two ways in:
 * - inviteCode (the link) — works for public and private leagues, and is
 *   the only path that supports claiming a historical member slot.
 * - leagueRef + password — private leagues only; the league id/slug plus
 *   the commissioner-set league password.
 */
export async function POST(request: NextRequest) {
  const user = await requireUser();
  if (!user.ok) return authzError(user);

  const sql = getDb();

  try {
    const { inviteCode, claimMemberId, leagueRef, password } = await request.json();

    let league: DbRow | undefined;

    if (inviteCode?.trim()) {
      [league] = await sql`SELECT * FROM leagues WHERE invite_code = ${inviteCode.trim()}`;
      if (!league) {
        return NextResponse.json({ error: "Invalid invite code" }, { status: 404 });
      }
    } else if (leagueRef?.trim() && typeof password === "string") {
      // Generic error for every failure mode so the join box can't be used
      // to probe which leagues exist.
      const badCombo = NextResponse.json(
        { error: "League and password don't match" },
        { status: 403 }
      );
      const ref = leagueRef.trim();
      const [candidate] = await sql`
        SELECT * FROM leagues WHERE slug = ${ref} OR id::text = ${ref}
      `;
      if (!candidate || !candidate.is_private) return badCombo;
      // Encrypted password first; legacy bcrypt hash as fallback.
      const ok = candidate.password_enc
        ? leaguePasswordMatches(password, candidate.password_enc)
        : !!candidate.password_hash &&
          (await bcrypt.compare(password, candidate.password_hash as string));
      if (!ok) return badCombo;
      league = candidate;
    } else {
      return NextResponse.json(
        { error: "An invite code, or a league and password, is required" },
        { status: 400 }
      );
    }

    // Password material never leaves the server.
    delete league.password_hash;
    delete league.password_enc;

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
