import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function POST() {
  const sql = getDb();

  try {
    await sql`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        email TEXT UNIQUE NOT NULL,
        name TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS user_passwords (
        user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
        password_hash TEXT NOT NULL
      )
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS leagues (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name TEXT NOT NULL,
        slug TEXT UNIQUE NOT NULL,
        commissioner_id UUID NOT NULL REFERENCES users(id),
        invite_code TEXT UNIQUE NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS league_members (
        id SERIAL PRIMARY KEY,
        league_id UUID NOT NULL REFERENCES leagues(id),
        user_id UUID NOT NULL REFERENCES users(id),
        display_name TEXT NOT NULL,
        joined_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(league_id, user_id)
      )
    `;

    // Add columns to existing tables (ignore if already exists)
    try { await sql`ALTER TABLE drafts ADD COLUMN league_id UUID REFERENCES leagues(id)`; } catch { /* already exists */ }
    try { await sql`ALTER TABLE draft_picks ADD COLUMN user_id UUID REFERENCES users(id)`; } catch { /* already exists */ }
    try { await sql`ALTER TABLE draft_members ADD COLUMN user_id UUID REFERENCES users(id)`; } catch { /* already exists */ }
    try { await sql`ALTER TABLE users ADD COLUMN username TEXT UNIQUE`; } catch { /* already exists */ }
    try { await sql`ALTER TABLE league_members ADD COLUMN team_name TEXT`; } catch { /* already exists */ }

    return NextResponse.json({ success: true, message: "Auth tables created" });
  } catch (error) {
    console.error("Auth setup error:", error);
    return NextResponse.json({ error: "Failed to set up auth tables" }, { status: 500 });
  }
}
