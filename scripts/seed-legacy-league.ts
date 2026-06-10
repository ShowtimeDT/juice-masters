/**
 * Seed the original Juice league into the database: creates the league,
 * adds every historical owner as a (claimable) member, and stores the
 * Masters + PGA results as locked drafts so tournament and season
 * standings include them.
 *
 * The commissioner must sign up through the site FIRST. Then:
 *
 *   npx tsx scripts/seed-legacy-league.ts \
 *     --email brother@example.com \
 *     --name "Juice Tour" \
 *     --slug juice-tour \
 *     --commissioner-display "Matty T"
 *
 * Idempotent — safe to re-run; existing rows are left alone.
 */
import { neon } from "@neondatabase/serverless";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { randomBytes } from "node:crypto";
import { MASTERS_ENTRIES } from "../src/lib/entries/masters";
import { PGA_ENTRIES } from "../src/lib/entries/pga";
import type { Entry } from "../src/lib/types";

interface Args {
  email: string;
  name: string;
  slug: string;
  commissionerDisplay: string | null;
}

function parseArgs(): Args {
  const argv = process.argv.slice(2);
  const get = (flag: string): string | null => {
    const i = argv.indexOf(flag);
    return i >= 0 && argv[i + 1] ? argv[i + 1] : null;
  };
  const email = get("--email");
  if (!email) {
    console.error(
      "Usage: npx tsx scripts/seed-legacy-league.ts --email <commissioner email> " +
        '[--name "Juice Tour"] [--slug juice-tour] [--commissioner-display "Name"]'
    );
    process.exit(1);
  }
  return {
    email: email.toLowerCase(),
    name: get("--name") ?? "Juice Tour",
    slug: get("--slug") ?? "juice-tour",
    commissionerDisplay: get("--commissioner-display"),
  };
}

function loadEnvLocal(): void {
  if (process.env.DATABASE_URL) return;
  try {
    const envFile = readFileSync(resolve(process.cwd(), ".env.local"), "utf8");
    for (const line of envFile.split("\n")) {
      const match = line.match(/^DATABASE_URL=["']?([^"'\n]+)["']?/);
      if (match) process.env.DATABASE_URL = match[1];
    }
  } catch {
    // DATABASE_URL must come from the environment
  }
}

const LEGACY_TOURNAMENTS: { tournamentId: string; draftName: string; entries: Entry[] }[] = [
  { tournamentId: "masters", draftName: "Juice Masters", entries: MASTERS_ENTRIES },
  { tournamentId: "pga", draftName: "Juice Championship", entries: PGA_ENTRIES },
];

async function seed(): Promise<void> {
  loadEnvLocal();
  if (!process.env.DATABASE_URL) {
    console.error("DATABASE_URL is not set");
    process.exit(1);
  }
  const sql = neon(process.env.DATABASE_URL);
  const args = parseArgs();

  // 1. Commissioner account must already exist.
  const [commissioner] = await sql`SELECT id, name FROM users WHERE lower(email) = ${args.email}`;
  if (!commissioner) {
    console.error(`No account found for ${args.email} — they must sign up on the site first.`);
    process.exit(1);
  }

  // 2. League (reuse if the slug already exists).
  let [league] = await sql`SELECT * FROM leagues WHERE slug = ${args.slug}`;
  if (!league) {
    const inviteCode = randomBytes(6).toString("base64url");
    [league] = await sql`
      INSERT INTO leagues (name, slug, commissioner_id, invite_code)
      VALUES (${args.name}, ${args.slug}, ${commissioner.id}, ${inviteCode})
      RETURNING *
    `;
    console.log(`Created league "${args.name}" (${args.slug}), invite code: ${inviteCode}`);
  } else {
    console.log(`League ${args.slug} already exists — reusing.`);
  }

  // 3. Members: every historical owner, claimable (user_id NULL).
  //    team_name = display_name so standings show "James T" exactly as the
  //    static site did. The commissioner's own slot is linked immediately.
  const owners = [...new Set(LEGACY_TOURNAMENTS.flatMap((t) => t.entries.map((e) => e.owner)))];
  for (const owner of owners) {
    // No unique constraint covers NULL-user members, so check by name.
    const [existing] = await sql`
      SELECT id FROM league_members WHERE league_id = ${league.id} AND display_name = ${owner}
    `;
    if (existing) continue;
    const isCommissioner = owner === args.commissionerDisplay;
    await sql`
      INSERT INTO league_members (league_id, user_id, display_name, team_name)
      VALUES (${league.id}, ${isCommissioner ? commissioner.id : null}, ${owner}, ${owner})
    `;
  }
  console.log(`Ensured ${owners.length} league members.`);

  // 4. Historical tournaments as locked drafts.
  for (const { tournamentId, draftName, entries } of LEGACY_TOURNAMENTS) {
    const draftId = `draft-${tournamentId}-legacy-${(league.id as string).slice(0, 8)}`;
    await sql`
      INSERT INTO drafts (id, tournament_id, name, status, league_id)
      VALUES (${draftId}, ${tournamentId}, ${draftName}, 'locked', ${league.id})
      ON CONFLICT (id) DO NOTHING
    `;

    // Stub tiers so the manage page renders sensibly.
    for (let t = 1; t <= 8; t++) {
      await sql`
        INSERT INTO draft_tiers (draft_id, tier_number, name)
        VALUES (${draftId}, ${t}, ${`Tier ${t}`})
        ON CONFLICT DO NOTHING
      `;
    }

    for (const entry of entries) {
      await sql`
        INSERT INTO draft_members (draft_id, name)
        VALUES (${draftId}, ${entry.owner})
        ON CONFLICT DO NOTHING
      `;
      for (const [index, golfer] of entry.golfers.entries()) {
        await sql`
          INSERT INTO draft_picks (draft_id, owner, tier_number, golfer_name, tiebreaker_guess)
          VALUES (${draftId}, ${entry.owner}, ${index + 1}, ${golfer}, ${entry.tiebreakerGuess})
          ON CONFLICT DO NOTHING
        `;
      }
    }
    console.log(`Seeded ${entries.length} entries for ${tournamentId} (${draftId}).`);
  }

  console.log("Done. Members claim their name when joining via the invite link.");
}

seed().catch((e) => {
  console.error(e);
  process.exit(1);
});
