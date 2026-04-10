import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getDb } from "@/lib/db";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ draftId: string }> }
) {
  const { draftId } = await params;
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const sql = getDb();

  try {
    // Verify commissioner
    const [draft] = await sql`SELECT * FROM drafts WHERE id = ${draftId}`;
    if (!draft?.league_id) {
      return NextResponse.json({ error: "Draft not found" }, { status: 404 });
    }
    const [league] = await sql`SELECT commissioner_id FROM leagues WHERE id = ${draft.league_id}`;
    if (league?.commissioner_id !== session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { close_time } = await request.json();

    await sql`UPDATE drafts SET close_time = ${close_time} WHERE id = ${draftId}`;
    const [updated] = await sql`SELECT * FROM drafts WHERE id = ${draftId}`;
    return NextResponse.json(updated);
  } catch (error) {
    console.error("Close time error:", error);
    return NextResponse.json({ error: "Failed to set close time" }, { status: 500 });
  }
}
