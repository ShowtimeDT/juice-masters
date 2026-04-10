import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function POST() {
  const sql = getDb();

  try {
    // Create tables
    await sql`
      CREATE TABLE IF NOT EXISTS drafts (
        id TEXT PRIMARY KEY,
        tournament_id TEXT NOT NULL,
        name TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'open',
        created_at TIMESTAMP DEFAULT NOW()
      )
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS draft_tiers (
        id SERIAL PRIMARY KEY,
        draft_id TEXT NOT NULL REFERENCES drafts(id),
        tier_number INTEGER NOT NULL,
        name TEXT NOT NULL,
        UNIQUE(draft_id, tier_number)
      )
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS draft_golfers (
        id SERIAL PRIMARY KEY,
        draft_id TEXT NOT NULL REFERENCES drafts(id),
        tier_number INTEGER NOT NULL,
        name TEXT NOT NULL,
        espn_id TEXT DEFAULT '',
        UNIQUE(draft_id, tier_number, name)
      )
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS draft_picks (
        id SERIAL PRIMARY KEY,
        draft_id TEXT NOT NULL REFERENCES drafts(id),
        owner TEXT NOT NULL,
        tier_number INTEGER NOT NULL,
        golfer_name TEXT NOT NULL,
        tiebreaker_guess INTEGER,
        picked_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(draft_id, owner, tier_number)
      )
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS draft_members (
        id SERIAL PRIMARY KEY,
        draft_id TEXT NOT NULL REFERENCES drafts(id),
        name TEXT NOT NULL,
        UNIQUE(draft_id, name)
      )
    `;

    // Add columns that may not exist yet
    try { await sql`ALTER TABLE drafts ADD COLUMN close_time TIMESTAMP`; } catch { /* already exists */ }
    try { await sql`ALTER TABLE drafts ADD COLUMN league_id UUID`; } catch { /* already exists */ }
    try { await sql`ALTER TABLE draft_picks ADD COLUMN user_id UUID`; } catch { /* already exists */ }
    try { await sql`ALTER TABLE draft_members ADD COLUMN user_id UUID`; } catch { /* already exists */ }

    return NextResponse.json({ success: true, message: "Tables created" });
  } catch (error) {
    console.error("Setup error:", error);
    return NextResponse.json(
      { error: "Failed to set up database" },
      { status: 500 }
    );
  }
}
