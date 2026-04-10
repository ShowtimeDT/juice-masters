import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ draftId: string }> }
) {
  const { draftId } = await params;
  const sql = getDb();

  try {
    const { members } = await request.json();

    await sql`DELETE FROM draft_members WHERE draft_id = ${draftId}`;

    for (const name of members) {
      await sql`
        INSERT INTO draft_members (draft_id, name)
        VALUES (${draftId}, ${name})
      `;
    }

    const result = await sql`
      SELECT * FROM draft_members WHERE draft_id = ${draftId} ORDER BY name
    `;
    return NextResponse.json(result);
  } catch (error) {
    console.error("Members error:", error);
    return NextResponse.json({ error: "Failed to update members" }, { status: 500 });
  }
}
