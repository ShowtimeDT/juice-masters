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

    const { tiers } = (await request.json()) as {
      tiers: { tier_number: number; name: string }[];
    };
    if (!Array.isArray(tiers)) {
      return NextResponse.json({ error: "tiers must be an array" }, { status: 400 });
    }

    await sql.transaction([
      sql`DELETE FROM draft_tiers WHERE draft_id = ${draftId}`,
      ...tiers.map(
        (tier) => sql`
          INSERT INTO draft_tiers (draft_id, tier_number, name)
          VALUES (${draftId}, ${tier.tier_number}, ${tier.name})
        `
      ),
    ]);

    const result = await sql`
      SELECT * FROM draft_tiers WHERE draft_id = ${draftId} ORDER BY tier_number
    `;
    return NextResponse.json(result);
  } catch (error) {
    console.error("Tiers error:", error);
    return NextResponse.json({ error: "Failed to update tiers" }, { status: 500 });
  }
}
