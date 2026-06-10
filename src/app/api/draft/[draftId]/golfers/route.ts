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

    if (authz.draft.status === "locked") {
      return NextResponse.json(
        { error: "Draft is locked — golfers can no longer be changed" },
        { status: 400 }
      );
    }

    const { golfers } = (await request.json()) as {
      golfers: { tier_number: number; name: string; espn_id?: string }[];
    };
    if (!withinSize(golfers, LIMITS.maxGolfers)) {
      return NextResponse.json({ error: "Too many golfers" }, { status: 400 });
    }
    for (const g of golfers) {
      if (!Number.isInteger(g.tier_number) || cleanName(g.name) === null) {
        return NextResponse.json({ error: "Invalid golfer" }, { status: 400 });
      }
    }

    await sql.transaction([
      sql`DELETE FROM draft_golfers WHERE draft_id = ${draftId}`,
      ...golfers.map(
        (g) => sql`
          INSERT INTO draft_golfers (draft_id, tier_number, name, espn_id)
          VALUES (${draftId}, ${g.tier_number}, ${cleanName(g.name)}, ${String(g.espn_id || "").slice(0, 32)})
        `
      ),
    ]);

    const result = await sql`
      SELECT * FROM draft_golfers WHERE draft_id = ${draftId} ORDER BY tier_number, name
    `;
    return NextResponse.json(result);
  } catch (error) {
    console.error("Golfers error:", error);
    return NextResponse.json({ error: "Failed to update golfers" }, { status: 500 });
  }
}
