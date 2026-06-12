# Juice Tour — Fantasy Golf Platform

Multi-league fantasy golf for the majors. Members sign in (Google or
email/password), join a league, draft one golfer from each of 8 odds-based
tiers before the tournament, and the site scores everything live from ESPN:
best 5 of 8 counting scores, +10 missed-cut penalty, total-birdies tiebreaker,
per-tournament and season-long standings.

## Local development

```bash
npm install
npm run dev        # http://localhost:3000
npm run build      # production build (run before pushing)
npm run lint
```

`.env.local` needs:

| Variable | Purpose |
| --- | --- |
| `DATABASE_URL` | Neon Postgres connection string |
| `AUTH_SECRET` | NextAuth JWT secret (`npx auth secret` to generate) |
| `AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET` | Google OAuth client (optional — the Google button hides itself when unset) |

Google credentials come from [Google Cloud Console](https://console.cloud.google.com/apis/credentials):
create an OAuth 2.0 Client ID (web application) with redirect URIs
`https://<your-domain>/api/auth/callback/google` and
`http://localhost:3000/api/auth/callback/google`.

## Database setup

Schema changes live in `scripts/migrate.ts` (idempotent):

```bash
npx tsx scripts/migrate.ts
```

One-time migration of the original league (commissioner signs up on the
site first):

```bash
npx tsx scripts/seed-legacy-league.ts \
  --email commissioner@example.com \
  --name "Juice Tour" --slug juice-tour \
  --commissioner-display "Matty T"
```

This seeds every historical owner as a claimable member and stores the
Masters + PGA results as locked drafts, so season standings include them.
Members claim their name when they join via the invite link.

## Commissioner runbook (per tournament)

1. **~3 days before the first round** (once ESPN lists the field): League →
   Manage League → the tournament's **Play This Tournament**. This builds
   8 tiers × 10 golfers from ESPN's ordering — review the tiers in the
   tier editor and adjust if anything looks off.
2. Set a **Close Time** (recommended: 15–30 minutes before the first tee
   time), then hit **Save Changes & Start Draft** — the draft goes live
   and members can pick.
3. Members visit the league page → **Draft Now** → one golfer per tier +
   tiebreaker guess. Watch the "picks in" counter and nag stragglers.
   Picks are private until the draft locks.
4. The draft **locks automatically** at the close time (or 15 minutes
   before the first tee time if no close time is set). After lock, the
   tournament tab shows live standings — nothing else to do.

**If the draft system misbehaves during tournament week:** collect picks by
text, hardcode them in `src/lib/entries/<tournament>.ts`, set that
tournament's `hasEntries: true` in `src/lib/tournaments.ts`, and redeploy —
the site falls back to the proven static-entries leaderboard.

## Changing the look

- App-wide colors (cards, borders, score green/red, brand gold) are CSS
  variables in `src/app/globals.css` under `@theme` — one file to retheme.
- Per-tournament colors (header gradients, accents) are the theme objects
  in `src/lib/tournaments.ts`.

## Architecture notes

- `src/lib/espn.ts` parses ESPN scoreboard data (via `/api/scores`, which
  proxies and attaches cut info from ESPN's core API).
- `src/lib/scoring.ts` computes standings; draft picks are converted to the
  same `Entry` shape (`/api/draft/[draftId]/entries`), so drafted and
  hardcoded tournaments score identically.
- `src/lib/authz.ts` holds the authorization helpers every mutating API
  route uses (`requireUser`, `requireLeagueCommissioner`,
  `requireDraftCommissioner`, `requireLeagueMember`).
- Auth is NextAuth v5, JWT sessions; OAuth identities map to users via
  `user_identities` (`src/lib/oauth-users.ts`).
