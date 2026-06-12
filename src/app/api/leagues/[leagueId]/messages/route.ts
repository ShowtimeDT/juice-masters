import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { requireLeagueMember, authzError } from "@/lib/authz";
import { cleanMessage } from "@/lib/validate";

/**
 * League chat: a permanent members-only bulletin board. No edits, no
 * deletions — what's posted stays.
 */

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ leagueId: string }> }
) {
  const { leagueId } = await params;

  const authz = await requireLeagueMember(leagueId);
  if (!authz.ok) return authzError(authz);

  const sql = getDb();
  try {
    // Last 200, oldest first. Team identity comes from the membership row;
    // users.name is the fallback if a member was unlinked.
    const messages = await sql`
      SELECT m.id, m.user_id, m.body, m.created_at,
             COALESCE(lm.display_name, u.name) AS display_name,
             lm.team_name, lm.team_photo
      FROM (
        SELECT * FROM league_messages
        WHERE league_id = ${leagueId}
        ORDER BY id DESC LIMIT 200
      ) m
      LEFT JOIN league_members lm
        ON lm.league_id = ${leagueId} AND lm.user_id = m.user_id
      LEFT JOIN users u ON u.id = m.user_id
      ORDER BY m.id ASC
    `;
    return NextResponse.json({ messages });
  } catch (error) {
    console.error("Messages error:", error);
    return NextResponse.json({ error: "Failed to load messages" }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ leagueId: string }> }
) {
  const { leagueId } = await params;

  const authz = await requireLeagueMember(leagueId);
  if (!authz.ok) return authzError(authz);

  const sql = getDb();
  try {
    const { body: rawBody } = await request.json();
    const body = cleanMessage(rawBody);
    if (body === null) {
      return NextResponse.json(
        { error: "Messages must be 1–1000 characters" },
        { status: 400 }
      );
    }

    const [message] = await sql`
      INSERT INTO league_messages (league_id, user_id, body)
      VALUES (${leagueId}, ${authz.userId}, ${body})
      RETURNING id, user_id, body, created_at
    `;

    return NextResponse.json({
      message: {
        ...message,
        display_name: authz.member.display_name,
        team_name: authz.member.team_name,
        team_photo: (authz.member as { team_photo?: string | null }).team_photo ?? null,
      },
    });
  } catch (error) {
    console.error("Post message error:", error);
    return NextResponse.json({ error: "Failed to post message" }, { status: 500 });
  }
}
