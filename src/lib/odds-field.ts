/**
 * Field source of last resort: The Odds API's outright-winner market.
 *
 * ESPN doesn't publish a major's field until pairings finalize (Tue/Wed),
 * but sportsbooks list every entrant as soon as the field is set. We read
 * that list ONLY to populate and rank the draft tiers — the odds prices
 * themselves are never stored or shown (see the no-odds-display decision).
 */

const ODDS_API_BASE = "https://api.the-odds-api.com/v4/sports";

interface OddsOutcome {
  name: string;
  price: number;
}

/**
 * Returns the field as player names ordered favorites-first (shortest odds
 * = tier 1). Empty array on any problem — missing key, HTTP error, no event
 * listed yet — so callers cleanly fall back to ESPN. Never throws.
 */
export async function fetchOddsField(sportKey: string): Promise<string[]> {
  const apiKey = process.env.ODDS_API_KEY;
  if (!apiKey || !sportKey) return [];

  const url =
    `${ODDS_API_BASE}/${sportKey}/odds` +
    `?apiKey=${apiKey}&regions=us&markets=outrights&oddsFormat=american`;

  try {
    const res = await fetch(url);
    if (!res.ok) return [];
    const events = (await res.json()) as Array<{
      bookmakers?: Array<{ key: string; markets?: Array<{ outcomes?: OddsOutcome[] }> }>;
    }>;
    if (!Array.isArray(events) || events.length === 0) return [];

    const books = events[0].bookmakers ?? [];
    if (books.length === 0) return [];
    // Prefer DraftKings for a stable, complete field; else the first book.
    const book = books.find((b) => b.key === "draftkings") ?? books[0];
    const outcomes = book.markets?.[0]?.outcomes ?? [];

    return outcomes
      .filter((o) => o && typeof o.name === "string" && Number.isFinite(o.price))
      .sort((a, b) => a.price - b.price) // favorites (shortest price) first
      .map((o) => o.name.trim());
  } catch {
    return [];
  }
}
