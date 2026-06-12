import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import {
  isLeagueMemberOrCommissioner,
  requireLeagueCommissioner,
  authzError,
} from "@/lib/authz";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ leagueId: string }> }
) {
  const { leagueId } = await params;
  const sql = getDb();

  try {
    // Support lookup by slug or id
    const [league] = await sql`
      SELECT * FROM leagues WHERE slug = ${leagueId} OR id::text = ${leagueId}
    `;
    if (!league) {
      return NextResponse.json({ error: "League not found" }, { status: 404 });
    }

    // No emails; LEFT JOIN so unclaimed historical members still appear.
    const members = await sql`
      SELECT lm.id, lm.league_id, lm.user_id, lm.display_name, lm.team_name,
             lm.team_photo, lm.joined_at, u.username
      FROM league_members lm
      LEFT JOIN users u ON u.id = lm.user_id
      WHERE lm.league_id = ${league.id}
      ORDER BY lm.joined_at
    `;

    // The invite code is for members to share — don't hand it to strangers.
    if (!(await isLeagueMemberOrCommissioner(league.id as string))) {
      delete league.invite_code;
    }

    return NextResponse.json({ league, members });
  } catch (error) {
    console.error("League error:", error);
    return NextResponse.json({ error: "Failed to fetch league" }, { status: 500 });
  }
}

/**
 * Permanently delete a league and everything in it: drafts (with their
 * tiers, golfers, and picks) and memberships. Commissioner only.
 */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ leagueId: string }> }
) {
  const { leagueId } = await params;
  const sql = getDb();

  try {
    // Accept slug or id, like GET does.
    const [league] = await sql`
      SELECT id, name FROM leagues WHERE slug = ${leagueId} OR id::text = ${leagueId}
    `;
    if (!league) {
      return NextResponse.json({ error: "League not found" }, { status: 404 });
    }

    const authz = await requireLeagueCommissioner(league.id as string);
    if (!authz.ok) return authzError(authz);

    const id = league.id as string;
    await sql.transaction([
      sql`DELETE FROM draft_picks WHERE draft_id IN (SELECT id FROM drafts WHERE league_id = ${id})`,
      sql`DELETE FROM draft_golfers WHERE draft_id IN (SELECT id FROM drafts WHERE league_id = ${id})`,
      sql`DELETE FROM draft_tiers WHERE draft_id IN (SELECT id FROM drafts WHERE league_id = ${id})`,
      sql`DELETE FROM draft_members WHERE draft_id IN (SELECT id FROM drafts WHERE league_id = ${id})`,
      sql`DELETE FROM drafts WHERE league_id = ${id}`,
      sql`DELETE FROM league_members WHERE league_id = ${id}`,
      sql`DELETE FROM leagues WHERE id = ${id}`,
    ]);

    return NextResponse.json({ success: true, deleted: league.name });
  } catch (error) {
    console.error("Delete league error:", error);
    return NextResponse.json({ error: "Failed to delete league" }, { status: 500 });
  }
}
