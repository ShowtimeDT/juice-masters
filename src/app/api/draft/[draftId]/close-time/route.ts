import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { requireDraftCommissioner, authzError } from "@/lib/authz";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ draftId: string }> }
) {
  const { draftId } = await params;
  const sql = getDb();

  try {
    const authz = await requireDraftCommissioner(draftId);
    if (!authz.ok) return authzError(authz);

    const { close_time } = await request.json();

    // null clears the close time; anything else must be a valid timestamp.
    if (close_time !== null && Number.isNaN(Date.parse(close_time))) {
      return NextResponse.json({ error: "Invalid close time" }, { status: 400 });
    }

    await sql`UPDATE drafts SET close_time = ${close_time} WHERE id = ${draftId}`;
    const [updated] = await sql`SELECT * FROM drafts WHERE id = ${draftId}`;
    return NextResponse.json(updated);
  } catch (error) {
    console.error("Close time error:", error);
    return NextResponse.json({ error: "Failed to set close time" }, { status: 500 });
  }
}
