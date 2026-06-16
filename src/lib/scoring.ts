import { Entry, EntryStanding, GolferScore, GolferScoreWithCounting, TournamentData } from "./types";
import { resolveGolferName, normalizeGolferName } from "./entries/aliases";

const CUT_PENALTY = 10;
const COUNTING_GOLFERS = 5;

/** Last name + first initial, normalized — for the fuzzy fallback match. */
function lastNamePlusInitial(name: string): { last: string; initial: string } {
  const parts = normalizeGolferName(name).split(" ").filter(Boolean);
  if (parts.length === 0) return { last: "", initial: "" };
  return { last: parts[parts.length - 1], initial: parts[0][0] ?? "" };
}

export function getGolferScore(
  golferName: string,
  golferScores: Map<string, GolferScore>
): GolferScore {
  // 1. Explicit alias, then exact match on ESPN's name.
  const resolved = resolveGolferName(golferName);
  const exact = golferScores.get(resolved);
  if (exact) return exact;

  // 2. Accent/punctuation/case-insensitive match (Åberg≈Aberg, J.J.≈JJ).
  const target = normalizeGolferName(resolved);
  for (const value of golferScores.values()) {
    if (normalizeGolferName(value.name) === target) return value;
  }

  // 3. Last name + first initial, but ONLY when exactly one ESPN golfer
  //    qualifies — handles "Christopher Gotterup"→"Chris Gotterup" without
  //    risking a wrong match among shared surnames (Kim, Fitzpatrick…).
  const { last, initial } = lastNamePlusInitial(resolved);
  if (last && initial) {
    const candidates: GolferScore[] = [];
    for (const value of golferScores.values()) {
      const c = lastNamePlusInitial(value.name);
      if (c.last === last && c.initial === initial) candidates.push(value);
    }
    if (candidates.length === 1) return candidates[0];
  }

  // Not found — placeholder that scores Even. Loud warning because an
  // unmatched name (typo / missing alias) silently flatters that entry.
  if (golferScores.size > 0) {
    console.warn(
      `[scoring] Golfer "${golferName}" (resolved: "${resolved}") not found in ESPN data — scoring as E. ` +
        "Check src/lib/entries/aliases.ts."
    );
  }
  return {
    name: golferName,
    espnId: "",
    score: 0,
    scoreDisplay: "-",
    rounds: [],
    birdies: 0,
    missedCut: false,
    position: "-",
    thru: "-",
  };
}

export function calculateStandings(
  entries: Entry[],
  tournamentData: TournamentData
): EntryStanding[] {
  const standings: EntryStanding[] = entries.map((entry) => {
    const golferScores: GolferScoreWithCounting[] = entry.golfers.map(
      (golferName, index) => {
        const gs = getGolferScore(golferName, tournamentData.golferScores);
        const effectiveScore = gs.missedCut ? gs.score + CUT_PENALTY : gs.score;
        return {
          ...gs,
          effectiveScore,
          isCounting: false,
          tier: index + 1,
        };
      }
    );

    // Sort by effective score ascending (best first)
    const sorted = [...golferScores].sort(
      (a, b) => a.effectiveScore - b.effectiveScore
    );

    // Mark top 5 as counting
    sorted.forEach((g, i) => {
      g.isCounting = i < COUNTING_GOLFERS;
    });

    // Calculate counting score
    const countingScore = sorted
      .slice(0, COUNTING_GOLFERS)
      .reduce((sum, g) => sum + g.effectiveScore, 0);

    // Restore original tier order for display, keeping isCounting flags
    const displayOrder = golferScores.map((g) => {
      const match = sorted.find((s) => s.name === g.name && s.tier === g.tier);
      return match || g;
    });

    return {
      entry,
      golferScores: displayOrder,
      countingScore,
      rank: 0,
    };
  });

  // Sort by counting score ascending
  standings.sort((a, b) => a.countingScore - b.countingScore);

  // Assign ranks (handle ties)
  let currentRank = 1;
  for (let i = 0; i < standings.length; i++) {
    if (i > 0 && standings[i].countingScore === standings[i - 1].countingScore) {
      standings[i].rank = standings[i - 1].rank;
    } else {
      standings[i].rank = currentRank;
    }
    currentRank = i + 2;
  }

  return standings;
}
