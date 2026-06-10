import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { requireDraftCommissioner, authzError } from "@/lib/authz";
import { LIMITS, withinSize, cleanName } from "@/lib/validate";

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
    if (!withinSize(tiers, LIMITS.maxTiers)) {
      return NextResponse.json({ error: "Too many tiers" }, { status: 400 });
    }
    for (const tier of tiers) {
      if (!Number.isInteger(tier.tier_number) || cleanName(tier.name) === null) {
        return NextResponse.json({ error: "Invalid tier" }, { status: 400 });
      }
    }

    await sql.transaction([
      sql`DELETE FROM draft_tiers WHERE draft_id = ${draftId}`,
      ...tiers.map(
        (tier) => sql`
          INSERT INTO draft_tiers (draft_id, tier_number, name)
          VALUES (${draftId}, ${tier.tier_number}, ${cleanName(tier.name)})
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
