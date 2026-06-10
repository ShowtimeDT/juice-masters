import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { TOURNAMENTS } from "@/lib/tournaments";

const ESPN_BASE = "https://site.api.espn.com/apis/site/v2/sports/golf/pga/scoreboard";
const NUM_TIERS = 8;
const GOLFERS_PER_TIER = 10;
const MAX_GOLFERS = NUM_TIERS * GOLFERS_PER_TIER; // 80

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const sql = getDb();

  try {
    const { tournament_id, league_id } = await request.json();

    // Verify user is commissioner
    const [league] = await sql`SELECT * FROM leagues WHERE id = ${league_id}`;
    if (!league || league.commissioner_id !== session.user.id) {
      return NextResponse.json({ error: "Only the commissioner can create drafts" }, { status: 403 });
    }

    // Check if draft already exists for this tournament + league
    const [existing] = await sql`
      SELECT id FROM drafts WHERE tournament_id = ${tournament_id} AND league_id = ${league_id}
    `;
    if (existing) {
      return NextResponse.json({ error: "A draft already exists for this tournament" }, { status: 409 });
    }

    // Get tournament config
    const tournament = TOURNAMENTS.find((t) => t.id === tournament_id);
    if (!tournament) {
      return NextResponse.json({ error: "Tournament not found" }, { status: 404 });
    }

    // Fetch ESPN field
    const espnUrl = `${ESPN_BASE}?dates=${tournament.espnDatesParam}`;
    const espnRes = await fetch(espnUrl);
    const espnData = await espnRes.json();

    const event = espnData.events?.[0];
    const competitors = event?.competitions?.[0]?.competitors || [];

    if (competitors.length < 10) {
      return NextResponse.json({
        error: "Field not available yet on ESPN. Try again later.",
        competitorCount: competitors.length,
      }, { status: 400 });
    }

    // Sort by order (ESPN ranking/odds order)
    const sorted = [...competitors].sort(
      (a: { order: number }, b: { order: number }) => (a.order || 999) - (b.order || 999)
    );

    // Take top 80 golfers by odds/ranking
    const topGolfers = sorted.slice(0, MAX_GOLFERS);

    // Build tier assignments: 10 golfers per tier
    const tiers: { tier_number: number; name: string }[] = [];
    const golfers: { tier_number: number; name: string; espn_id: string }[] = [];

    let idx = 0;
    for (let t = 1; t <= NUM_TIERS; t++) {
      tiers.push({
        tier_number: t,
        name: `Tier ${t}`,
      });

      for (let g = 0; g < GOLFERS_PER_TIER && idx < topGolfers.length; g++) {
        const comp = topGolfers[idx];
        golfers.push({
          tier_number: t,
          name: comp.athlete?.displayName || comp.athlete?.fullName || "Unknown",
          espn_id: comp.id?.toString() || "",
        });
        idx++;
      }
    }

    // Create draft
    const draftId = `draft-${tournament_id}-${Date.now()}`;
    const draftName = tournament.name;

    await sql`
      INSERT INTO drafts (id, tournament_id, name, status, league_id)
      VALUES (${draftId}, ${tournament_id}, ${draftName}, 'pending', ${league_id})
    `;

    // Insert tiers
    for (const tier of tiers) {
      await sql`
        INSERT INTO draft_tiers (draft_id, tier_number, name)
        VALUES (${draftId}, ${tier.tier_number}, ${tier.name})
      `;
    }

    // Insert golfers
    for (const g of golfers) {
      await sql`
        INSERT INTO draft_golfers (draft_id, tier_number, name, espn_id)
        VALUES (${draftId}, ${g.tier_number}, ${g.name}, ${g.espn_id})
      `;
    }

    // Auto-add all league members as draft members
    const leagueMembers = await sql`
      SELECT user_id, display_name FROM league_members WHERE league_id = ${league_id}
    `;
    for (const m of leagueMembers) {
      await sql`
        INSERT INTO draft_members (draft_id, name, user_id)
        VALUES (${draftId}, ${m.display_name}, ${m.user_id})
      `;
    }

    // Return full draft data
    const [draft] = await sql`SELECT * FROM drafts WHERE id = ${draftId}`;
    const dbTiers = await sql`SELECT * FROM draft_tiers WHERE draft_id = ${draftId} ORDER BY tier_number`;
    const dbGolfers = await sql`SELECT * FROM draft_golfers WHERE draft_id = ${draftId} ORDER BY tier_number, name`;

    return NextResponse.json({
      draft,
      tiers: dbTiers,
      golfers: dbGolfers,
      competitorCount: competitors.length,
    });
  } catch (error) {
    console.error("Auto-populate error:", error);
    return NextResponse.json({ error: "Failed to auto-populate draft" }, { status: 500 });
  }
}
