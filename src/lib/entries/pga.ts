import { Entry } from "../types";

// The 2026 PGA Championship results now live in the database as a locked
// draft in the Juice Tour league (seeded by scripts/seed-legacy-league.ts).
// This stays empty so other leagues never see another league's picks.
// Emergency fallback: paste entries here and set hasEntries: true for
// "pga" in src/lib/tournaments.ts.
export const PGA_ENTRIES: Entry[] = [];
