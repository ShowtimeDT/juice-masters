import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { Entry } from "@/lib/types";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ draftId: string }> }
) {
  const { draftId } = await params;
  const sql = getDb();

  try {
    const [draft] = await sql`SELECT * FROM drafts WHERE id = ${draftId}`;
    if (!draft || draft.status !== "locked") {
      return NextResponse.json({ error: "Draft is not locked" }, { status: 400 });
    }

    const picks = await sql`
      SELECT * FROM draft_picks WHERE draft_id = ${draftId} ORDER BY owner, tier_number
    `;

    // Group picks by owner
    const picksByOwner = new Map<string, typeof picks>();
    for (const pick of picks) {
      const ownerPicks = picksByOwner.get(pick.owner as string) || [];
      ownerPicks.push(pick);
      picksByOwner.set(pick.owner as string, ownerPicks);
    }

    // Convert to Entry[]
    const entries: Entry[] = [];
    let idx = 1;
    for (const [owner, ownerPicks] of picksByOwner) {
      const sorted = [...ownerPicks].sort(
        (a, b) => (a.tier_number as number) - (b.tier_number as number)
      );
      const golfers = sorted.map((p) => p.golfer_name as string);
      const tiebreaker = sorted.find((p) => p.tiebreaker_guess != null)?.tiebreaker_guess as number || 0;

      entries.push({
        id: `draft-entry-${idx}`,
        name: owner,
        owner: owner,
        golfers,
        tiebreakerGuess: tiebreaker,
      });
      idx++;
    }

    return NextResponse.json(entries);
  } catch (error) {
    console.error("Entries error:", error);
    return NextResponse.json({ error: "Failed to get entries" }, { status: 500 });
  }
}
