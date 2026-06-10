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

    const { members } = (await request.json()) as { members: string[] };
    if (!Array.isArray(members)) {
      return NextResponse.json({ error: "members must be an array" }, { status: 400 });
    }

    await sql.transaction([
      sql`DELETE FROM draft_members WHERE draft_id = ${draftId}`,
      ...members.map(
        (name) => sql`
          INSERT INTO draft_members (draft_id, name)
          VALUES (${draftId}, ${name})
        `
      ),
    ]);

    const result = await sql`
      SELECT * FROM draft_members WHERE draft_id = ${draftId} ORDER BY name
    `;
    return NextResponse.json(result);
  } catch (error) {
    console.error("Members error:", error);
    return NextResponse.json({ error: "Failed to update members" }, { status: 500 });
  }
}
