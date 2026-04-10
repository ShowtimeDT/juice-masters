import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ draftId: string }> }
) {
  const { draftId } = await params;
  const sql = getDb();

  try {
    const { golfers } = await request.json();

    await sql`DELETE FROM draft_golfers WHERE draft_id = ${draftId}`;

    for (const g of golfers) {
      await sql`
        INSERT INTO draft_golfers (draft_id, tier_number, name, espn_id)
        VALUES (${draftId}, ${g.tier_number}, ${g.name}, ${g.espn_id || ''})
      `;
    }

    const result = await sql`
      SELECT * FROM draft_golfers WHERE draft_id = ${draftId} ORDER BY tier_number, name
    `;
    return NextResponse.json(result);
  } catch (error) {
    console.error("Golfers error:", error);
    return NextResponse.json({ error: "Failed to update golfers" }, { status: 500 });
  }
}
