import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { requireLeagueCommissioner, authzError } from "@/lib/authz";
import { isTournamentId } from "@/lib/tournaments";

export async function POST(request: NextRequest) {
  const sql = getDb();
  try {
    const { tournament_id, name, league_id } = await request.json();

    if (!league_id) {
      return NextResponse.json({ error: "league_id is required" }, { status: 400 });
    }
    if (!isTournamentId(tournament_id) || tournament_id === "season") {
      return NextResponse.json({ error: "Invalid tournament" }, { status: 400 });
    }

    const authz = await requireLeagueCommissioner(league_id);
    if (!authz.ok) return authzError(authz);

    const id = `draft-${tournament_id}-${Date.now()}`;
    await sql`
      INSERT INTO drafts (id, tournament_id, name, status, league_id)
      VALUES (${id}, ${tournament_id}, ${name}, 'open', ${league_id})
    `;

    const [draft] = await sql`SELECT * FROM drafts WHERE id = ${id}`;
    return NextResponse.json(draft);
  } catch (error) {
    console.error("Create draft error:", error);
    return NextResponse.json({ error: "Failed to create draft" }, { status: 500 });
  }
}
