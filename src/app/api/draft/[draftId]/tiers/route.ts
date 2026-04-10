import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ draftId: string }> }
) {
  const { draftId } = await params;
  const sql = getDb();

  try {
    const { tiers } = await request.json();

    await sql`DELETE FROM draft_tiers WHERE draft_id = ${draftId}`;

    for (const tier of tiers) {
      await sql`
        INSERT INTO draft_tiers (draft_id, tier_number, name)
        VALUES (${draftId}, ${tier.tier_number}, ${tier.name})
      `;
    }

    const result = await sql`
      SELECT * FROM draft_tiers WHERE draft_id = ${draftId} ORDER BY tier_number
    `;
    return NextResponse.json(result);
  } catch (error) {
    console.error("Tiers error:", error);
    return NextResponse.json({ error: "Failed to update tiers" }, { status: 500 });
  }
}
