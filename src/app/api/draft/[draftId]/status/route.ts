import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ draftId: string }> }
) {
  const { draftId } = await params;
  const sql = getDb();

  try {
    const adminPassword = request.headers.get("x-admin-password");
    if (adminPassword !== process.env.ADMIN_PASSWORD) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { status } = await request.json();
    if (!["open", "closed", "locked"].includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    await sql`UPDATE drafts SET status = ${status} WHERE id = ${draftId}`;
    const [draft] = await sql`SELECT * FROM drafts WHERE id = ${draftId}`;
    return NextResponse.json(draft);
  } catch (error) {
    console.error("Status error:", error);
    return NextResponse.json({ error: "Failed to update status" }, { status: 500 });
  }
}
