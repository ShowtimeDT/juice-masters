import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { requireLeagueCommissioner, authzError } from "@/lib/authz";
import { validLeaguePassword } from "@/lib/validate";
import { decryptLeaguePassword, encryptLeaguePassword } from "@/lib/league-password";

/**
 * Commissioner league settings.
 *
 * GET ?league_id= — current privacy state plus the decrypted league
 * password (league passwords are shared join codes, recoverable by the
 * commissioner; see src/lib/league-password.ts).
 *
 * POST — update public/private and/or the password. Going private requires
 * a password (provided now or already set). A provided password replaces
 * the existing one.
 */
export async function GET(request: NextRequest) {
  const sql = getDb();

  try {
    const leagueId = request.nextUrl.searchParams.get("league_id");
    if (!leagueId) {
      return NextResponse.json({ error: "league_id is required" }, { status: 400 });
    }

    const authz = await requireLeagueCommissioner(leagueId);
    if (!authz.ok) return authzError(authz);

    const [league] = await sql`
      SELECT is_private, password_enc, password_hash FROM leagues WHERE id = ${leagueId}
    `;
    if (!league) {
      return NextResponse.json({ error: "League not found" }, { status: 404 });
    }

    const password = decryptLeaguePassword(league.password_enc);
    return NextResponse.json({
      is_private: !!league.is_private,
      password,
      // Legacy hash-only passwords work for joining but can't be displayed.
      has_password: !!(league.password_enc || league.password_hash),
    });
  } catch (error) {
    console.error("League settings read error:", error);
    return NextResponse.json({ error: "Failed to load settings" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const sql = getDb();

  try {
    const { league_id, is_private, password } = await request.json();
    if (!league_id || typeof is_private !== "boolean") {
      return NextResponse.json(
        { error: "league_id and is_private are required" },
        { status: 400 }
      );
    }

    const authz = await requireLeagueCommissioner(league_id);
    if (!authz.ok) return authzError(authz);

    if (password !== undefined && password !== null && !validLeaguePassword(password)) {
      return NextResponse.json(
        { error: "League password must be 4–72 characters" },
        { status: 400 }
      );
    }

    const [league] = await sql`
      SELECT password_enc, password_hash FROM leagues WHERE id = ${league_id}
    `;
    const hasPassword = !!(league?.password_enc || league?.password_hash);
    const newPassword = validLeaguePassword(password) ? password : null;

    if (is_private && !newPassword && !hasPassword) {
      return NextResponse.json(
        { error: "Set a league password to make the league private" },
        { status: 400 }
      );
    }

    if (newPassword) {
      // The encrypted password supersedes any legacy bcrypt hash.
      await sql`
        UPDATE leagues
        SET is_private = ${is_private},
            password_enc = ${encryptLeaguePassword(newPassword)},
            password_hash = NULL
        WHERE id = ${league_id}
      `;
    } else {
      await sql`UPDATE leagues SET is_private = ${is_private} WHERE id = ${league_id}`;
    }

    return NextResponse.json({ success: true, is_private });
  } catch (error) {
    console.error("League settings error:", error);
    return NextResponse.json({ error: "Failed to update settings" }, { status: 500 });
  }
}
