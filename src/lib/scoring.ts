import { Entry, EntryStanding, GolferScore, GolferScoreWithCounting, TournamentData } from "./types";
import { resolveGolferName } from "./entries";

const CUT_PENALTY = 10;
const COUNTING_GOLFERS = 5;

function getGolferScore(
  golferName: string,
  golferScores: Map<string, GolferScore>
): GolferScore {
  const resolved = resolveGolferName(golferName);
  const score = golferScores.get(resolved);
  if (score) return score;

  // Try case-insensitive match
  for (const [key, value] of golferScores.entries()) {
    if (key.toLowerCase() === resolved.toLowerCase()) {
      return value;
    }
  }

  // Not found - return placeholder
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
