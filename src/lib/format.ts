/**
 * Shared display helpers for golf scores and player info.
 * Color values come from the palette in src/app/globals.css (@theme tokens).
 */

/** "E" for even, "+2" over par, "-3" under par. */
export function formatScore(score: number): string {
  if (score === 0) return "E";
  if (score > 0) return `+${score}`;
  return score.toString();
}

/** Tailwind text-color class for a score relative to par. */
export function scoreColor(score: number): string {
  if (score < 0) return "text-under";
  if (score > 0) return "text-over";
  return "text-even";
}

/** Ordinal suffix: 1 → "st", 2 → "nd", 11 → "th", 21 → "st". */
export function rankSuffix(rank: number): string {
  const lastTwo = rank % 100;
  if (lastTwo >= 11 && lastTwo <= 13) return "th";
  switch (rank % 10) {
    case 1:
      return "st";
    case 2:
      return "nd";
    case 3:
      return "rd";
    default:
      return "th";
  }
}

/** ESPN headshot URL for a golfer's athlete ID. */
export function headshotUrl(espnId: string): string {
  return `https://a.espncdn.com/combiner/i?img=/i/headshots/golf/players/full/${espnId}.png&w=96&h=70&cb=1`;
}

/** Initials for golfers with no headshot ("Scottie Scheffler" → "SS"). */
export function golferInitials(name: string): string {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("");
}

/** Last name for compact labels ("Min Woo Lee" → "Lee"). */
export function golferLastName(name: string): string {
  return name.split(" ").pop() ?? name;
}

/** "S. Scheffler"-style abbreviation for narrow layouts. */
export function golferShortName(name: string): string {
  const parts = name.split(" ");
  if (parts.length < 2) return name;
  return `${parts[0][0]}. ${parts.slice(1).join(" ")}`;
}
