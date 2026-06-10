import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { requireUser, authzError } from "@/lib/authz";

/** Drafts in leagues the caller belongs to (or commissions). */
export async function GET() {
  const sql = getDb();
  try {
    const user = await requireUser();
    if (!user.ok) return authzError(user);

    const drafts = await sql`
      SELECT DISTINCT d.* FROM drafts d
      JOIN leagues l ON l.id = d.league_id
      LEFT JOIN league_members lm ON lm.league_id = l.id AND lm.user_id = ${user.userId}
      WHERE l.commissioner_id = ${user.userId} OR lm.user_id IS NOT NULL
      ORDER BY d.created_at DESC
    `;
    return NextResponse.json(drafts);
  } catch (error) {
    console.error("List drafts error:", error);
    return NextResponse.json({ error: "Failed to list drafts" }, { status: 500 });
  }
}
