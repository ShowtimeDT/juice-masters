import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { requireLeagueCommissioner, authzError } from "@/lib/authz";

/**
 * Commissioner removes a member from the league entirely: deletes their
 * membership and erases all of their draft picks across every major, so
 * they disappear from every leaderboard and the season standings. The
 * commissioner can't remove themselves. Permanent — no undo.
 *
 * Picks are matched both by display_name (legacy/seeded slots store the
 * owner as a name) and by user_id (claimed members), so claimed and
 * unclaimed slots both clear cleanly.
 */
export async function POST(request: NextRequest) {
  const sql = getDb();

  try {
    const { league_id, member_id } = await request.json();
    if (!league_id || member_id == null) {
      return NextResponse.json(
        { error: "league_id and member_id are required" },
        { status: 400 }
      );
    }

    const authz = await requireLeagueCommissioner(league_id);
    if (!authz.ok) return authzError(authz);

    const [member] = await sql`
      SELECT id, user_id, display_name FROM league_members
      WHERE id = ${member_id} AND league_id = ${league_id}
    `;
    if (!member) {
      return NextResponse.json({ error: "Member not found" }, { status: 404 });
    }
    if (member.user_id && member.user_id === authz.userId) {
      return NextResponse.json(
        { error: "You can't remove yourself — you're the commissioner" },
        { status: 400 }
      );
    }

    const displayName = member.display_name as string;
    const userId = member.user_id as string | null;

    // Erase picks/draft membership for this person across the league, then
    // drop the membership row — all atomically.
    const queries = [
      sql`
        DELETE FROM draft_picks
        WHERE draft_id IN (SELECT id FROM drafts WHERE league_id = ${league_id})
          AND owner = ${displayName}
      `,
      sql`
        DELETE FROM draft_members
        WHERE draft_id IN (SELECT id FROM drafts WHERE league_id = ${league_id})
          AND name = ${displayName}
      `,
    ];
    if (userId) {
      queries.push(sql`
        DELETE FROM draft_picks
        WHERE draft_id IN (SELECT id FROM drafts WHERE league_id = ${league_id})
          AND user_id = ${userId}
      `);
      queries.push(sql`
        DELETE FROM draft_members
        WHERE draft_id IN (SELECT id FROM drafts WHERE league_id = ${league_id})
          AND user_id = ${userId}
      `);
    }
    queries.push(sql`
      DELETE FROM league_members WHERE id = ${member_id} AND league_id = ${league_id}
    `);

    await sql.transaction(queries);

    return NextResponse.json({ success: true, removed: displayName });
  } catch (error) {
    console.error("Member remove error:", error);
    return NextResponse.json({ error: "Failed to remove member" }, { status: 500 });
  }
}
