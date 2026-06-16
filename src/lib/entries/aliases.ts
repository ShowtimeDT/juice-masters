// Name aliases: drafted/entry name -> ESPN's athlete.fullName.
// Used for TRUE nickname divergences that no algorithm can infer — e.g. a
// sportsbook lists "Joohyung Kim" while ESPN only ever calls him "Tom Kim",
// with no shared spelling. Accent and punctuation differences do NOT need an
// alias; normalizeGolferName + the fuzzy matcher in scoring.ts handle those
// automatically.
export const NAME_ALIASES: Record<string, string> = {
  // Sportsbook (The Odds API) names that differ from ESPN by more than
  // accents/punctuation — the cases the fuzzy matcher can't safely infer:
  "Joohyung Kim": "Tom Kim",

  // Accent/format cases (kept explicit for the seeded historical drafts;
  // new names are also handled automatically by normalizeGolferName):
  "Ludvig Aberg": "Ludvig Åberg",
  "Nicolai Hojgaard": "Nicolai Højgaard",
  "Rasmus Hojgaard": "Rasmus Højgaard",
  "Sami Valimaki": "Sami Välimäki",
  "Sung-Jae Im": "Sungjae Im",
  "JJ Spaun": "J.J. Spaun",
  "John Keefer": "Johnny Keefer",
  "Rasmus Neergaard": "Rasmus Neergaard-Petersen",
  "Tyrell Hatton": "Tyrrell Hatton",
};

export function resolveGolferName(name: string): string {
  return NAME_ALIASES[name] || name;
}

/**
 * Accent/punctuation/case-insensitive key for matching golfer names across
 * sources (sportsbook ASCII vs ESPN's accented spellings). "Ludvig Åberg"
 * and "Ludvig Aberg" both normalize to "ludvig aberg".
 */
export function normalizeGolferName(name: string): string {
  return name
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "") // strip combining accent marks
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ") // punctuation (J.J. -> j j) to spaces
    .replace(/\s+/g, " ")
    .trim();
}
