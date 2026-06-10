import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { requireUser, requireLeagueMember, authzError } from "@/lib/authz";
import { isPastDeadline } from "@/lib/draft/deadline";
import { validTiebreaker } from "@/lib/validate";

interface PickInput {
  tier_number: number;
  golfer_name: string;
}

/** Every tier picked exactly once, every golfer drawn from its tier's pool. */
async function validatePicks(
  draftId: string,
  picks: PickInput[]
): Promise<string | null> {
  const sql = getDb();
  const tiers = await sql`SELECT tier_number FROM draft_tiers WHERE draft_id = ${draftId}`;
  const golfers = await sql`SELECT tier_number, name FROM draft_golfers WHERE draft_id = ${draftId}`;

  const tierNumbers = new Set(tiers.map((t) => t.tier_number as number));
  const pickedTiers = new Set(picks.map((p) => p.tier_number));
  if (pickedTiers.size !== picks.length) return "Duplicate tier in picks";
  if (tierNumbers.size !== picks.length || ![...tierNumbers].every((t) => pickedTiers.has(t))) {
    return "Picks must include exactly one golfer for every tier";
  }

  const golferKeys = new Set(golfers.map((g) => `${g.tier_number}:${g.name}`));
  for (const p of picks) {
    if (!golferKeys.has(`${p.tier_number}:${p.golfer_name}`)) {
      return `${p.golfer_name} is not in tier ${p.tier_number}`;
    }
  }
  return null;
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ draftId: string }> }
) {
  const { draftId } = await params;
  const sql = getDb();

  try {
    const user = await requireUser();
    if (!user.ok) return authzError(user);

    const [draft] = await sql`SELECT * FROM drafts WHERE id = ${draftId}`;
    if (!draft) {
      return NextResponse.json({ error: "Draft not found" }, { status: 404 });
    }
    if (!draft.league_id) {
      return NextResponse.json({ error: "Draft has no league" }, { status: 400 });
    }

    // Identity comes from the caller's league membership — never the body.
    const membership = await requireLeagueMember(draft.league_id as string);
    if (!membership.ok) return authzError(membership);
    const owner = membership.member.display_name;

    if (draft.status !== "open") {
      return NextResponse.json({ error: "Draft is not open for picks" }, { status: 400 });
    }

    // Enforce the deadline (commissioner close_time, else tee-time auto-lock).
    if (isPastDeadline(draft)) {
      await sql`UPDATE drafts SET status = 'locked' WHERE id = ${draftId}`;
      return NextResponse.json(
        { error: "The draft deadline has passed — picks are locked" },
        { status: 400 }
      );
    }

    const { picks, tiebreaker_guess } = (await request.json()) as {
      picks: PickInput[];
      tiebreaker_guess: number;
    };

    if (!Array.isArray(picks) || picks.length === 0 || picks.length > 50) {
      return NextResponse.json({ error: "No picks submitted" }, { status: 400 });
    }
    if (!validTiebreaker(tiebreaker_guess)) {
      return NextResponse.json({ error: "Tiebreaker must be a whole number" }, { status: 400 });
    }

    const validationError = await validatePicks(draftId, picks);
    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 });
    }

    // Replace this member's picks atomically.
    await sql.transaction([
      sql`DELETE FROM draft_picks WHERE draft_id = ${draftId} AND owner = ${owner}`,
      ...picks.map(
        (pick) => sql`
          INSERT INTO draft_picks (draft_id, owner, user_id, tier_number, golfer_name, tiebreaker_guess)
          VALUES (${draftId}, ${owner}, ${user.userId}, ${pick.tier_number}, ${pick.golfer_name}, ${tiebreaker_guess})
        `
      ),
    ]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Pick error:", error);
    return NextResponse.json({ error: "Failed to submit picks" }, { status: 500 });
  }
}
