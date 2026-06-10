import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { requireDraftCommissioner, authzError } from "@/lib/authz";

const VALID_STATUSES = ["pending", "open", "closed", "locked"];

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ draftId: string }> }
) {
  const { draftId } = await params;
  const sql = getDb();

  try {
    const authz = await requireDraftCommissioner(draftId);
    if (!authz.ok) return authzError(authz);

    const { status } = await request.json();
    if (!VALID_STATUSES.includes(status)) {
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
