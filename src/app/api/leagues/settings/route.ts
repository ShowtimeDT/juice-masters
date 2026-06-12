import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getDb } from "@/lib/db";
import { requireLeagueCommissioner, authzError } from "@/lib/authz";
import { validLeaguePassword } from "@/lib/validate";

/**
 * Commissioner league settings: public/private toggle and the league
 * password. Going private requires a password (either provided now or
 * already set). Providing a password replaces the existing one.
 */
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

    const [league] = await sql`SELECT password_hash FROM leagues WHERE id = ${league_id}`;
    const newHash = validLeaguePassword(password) ? await bcrypt.hash(password, 10) : null;

    if (is_private && !newHash && !league?.password_hash) {
      return NextResponse.json(
        { error: "Set a league password to make the league private" },
        { status: 400 }
      );
    }

    if (newHash) {
      await sql`
        UPDATE leagues SET is_private = ${is_private}, password_hash = ${newHash}
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
