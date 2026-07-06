/**
 * A short monogram for a league crest (e.g. "RVA Dingos" -> "RD").
 * Falls back to the first two letters of a single word, or "?" if empty.
 */
export function leagueMonogram(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return "?";
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[words.length - 1][0]).toUpperCase();
}
