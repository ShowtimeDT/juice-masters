/**
 * Database schema migration. Idempotent — safe to re-run any time.
 *
 * Run with:  DATABASE_URL=postgres://... npx tsx scripts/migrate.ts
 * (or just `npx tsx scripts/migrate.ts` with .env.local loaded — see below)
 *
 * This replaces the old public /api/auth/setup and /api/draft/setup routes,
 * which let anyone on the internet run DDL against the database.
 */
import { neon } from "@neondatabase/serverless";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

function loadEnvLocal(): void {
  if (process.env.DATABASE_URL) return;
  try {
    const envFile = readFileSync(resolve(process.cwd(), ".env.local"), "utf8");
    for (const line of envFile.split("\n")) {
      const match = line.match(/^DATABASE_URL=["']?([^"'\n]+)["']?/);
      if (match) process.env.DATABASE_URL = match[1];
    }
  } catch {
    // no .env.local — DATABASE_URL must come from the environment
  }
}

async function migrate(): Promise<void> {
  loadEnvLocal();
  if (!process.env.DATABASE_URL) {
    console.error("DATABASE_URL is not set");
    process.exit(1);
  }
  const sql = neon(process.env.DATABASE_URL);

  // ---- Core tables -------------------------------------------------------

  await sql`
    CREATE TABLE IF NOT EXISTS users (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      email TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      username TEXT UNIQUE,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS user_passwords (
      user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
      password_hash TEXT NOT NULL
    )
  `;

  // OAuth identities (Google, Apple) — keyed on the provider's stable
  // subject id, since Apple only sends name/email on first authorization.
  await sql`
    CREATE TABLE IF NOT EXISTS user_identities (
      provider TEXT NOT NULL,
      provider_account_id TEXT NOT NULL,
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      created_at TIMESTAMP DEFAULT NOW(),
      PRIMARY KEY (provider, provider_account_id)
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
      user_id UUID REFERENCES users(id),
      display_name TEXT NOT NULL,
      team_name TEXT,
      joined_at TIMESTAMP DEFAULT NOW(),
      UNIQUE(league_id, user_id)
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS drafts (
      id TEXT PRIMARY KEY,
      tournament_id TEXT NOT NULL,
      name TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'open',
      close_time TIMESTAMP,
      league_id UUID REFERENCES leagues(id),
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
      user_id UUID REFERENCES users(id),
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
      user_id UUID REFERENCES users(id),
      UNIQUE(draft_id, name)
    )
  `;

  // ---- Upgrades for databases created before this script -----------------

  const alters = [
    sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS username TEXT UNIQUE`,
    sql`ALTER TABLE league_members ADD COLUMN IF NOT EXISTS team_name TEXT`,
    // Historical members can exist before they create an account (Phase 3).
    sql`ALTER TABLE league_members ALTER COLUMN user_id DROP NOT NULL`,
    sql`ALTER TABLE drafts ADD COLUMN IF NOT EXISTS close_time TIMESTAMP`,
    sql`ALTER TABLE drafts ADD COLUMN IF NOT EXISTS league_id UUID REFERENCES leagues(id)`,
    sql`ALTER TABLE draft_picks ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES users(id)`,
    sql`ALTER TABLE draft_members ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES users(id)`,
    // Team pictures: small client-resized JPEGs stored as data URLs.
    sql`ALTER TABLE league_members ADD COLUMN IF NOT EXISTS team_photo TEXT`,
    // Public/private leagues; private leagues carry a bcrypt password hash.
    sql`ALTER TABLE leagues ADD COLUMN IF NOT EXISTS is_private BOOLEAN DEFAULT FALSE`,
    sql`ALTER TABLE leagues ADD COLUMN IF NOT EXISTS password_hash TEXT`,
    // League password, AES-encrypted (recoverable by the commissioner).
    // Supersedes password_hash, which remains only as a legacy fallback.
    sql`ALTER TABLE leagues ADD COLUMN IF NOT EXISTS password_enc TEXT`,
  ];
  for (const alter of alters) {
    try {
      await alter;
    } catch (e) {
      console.warn("Skipped:", (e as Error).message);
    }
  }

  // League chat: permanent bulletin board, members-only.
  await sql`
    CREATE TABLE IF NOT EXISTS league_messages (
      id SERIAL PRIMARY KEY,
      league_id UUID NOT NULL REFERENCES leagues(id),
      user_id UUID NOT NULL REFERENCES users(id),
      body TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `;
  await sql`
    CREATE INDEX IF NOT EXISTS league_messages_league_idx
    ON league_messages (league_id, id)
  `;

  // Case-insensitive email uniqueness (signup/login normalize to lowercase).
  await sql`CREATE UNIQUE INDEX IF NOT EXISTS users_email_lower_idx ON users (lower(email))`;

  console.log("Migration complete.");
}

migrate().catch((e) => {
  console.error(e);
  process.exit(1);
});
