import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getDb } from "@/lib/db";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ draftId: string }> }
) {
  const { draftId } = await params;
  const sql = getDb();

  try {
    // Check auth — allow admin password OR authenticated commissioner
    const adminPassword = request.headers.get("x-admin-password");
    const session = await auth();

    let authorized = false;

    if (adminPassword === process.env.ADMIN_PASSWORD) {
      authorized = true;
    } else if (session?.user?.id) {
      // Check if user is commissioner of the league this draft belongs to
      const [draft] = await sql`SELECT league_id FROM drafts WHERE id = ${draftId}`;
      if (draft?.league_id) {
        const [league] = await sql`SELECT commissioner_id FROM leagues WHERE id = ${draft.league_id}`;
        if (league?.commissioner_id === session.user.id) {
          authorized = true;
        }
      }
    }

    if (!authorized) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { status } = await request.json();
    if (!["open", "closed", "locked"].includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    await sql`UPDATE drafts SET status = ${status} WHERE id = ${draftId}`;
    const [updatedDraft] = await sql`SELECT * FROM drafts WHERE id = ${draftId}`;
    return NextResponse.json(updatedDraft);
  } catch (error) {
    console.error("Status error:", error);
    return NextResponse.json({ error: "Failed to update status" }, { status: 500 });
  }
}
