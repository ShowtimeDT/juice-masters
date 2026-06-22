import { GolferScore } from "@/lib/types";
import { TeamGolfer } from "./MyTeam";

const CUT_PENALTY = 10;
const COUNTING_GOLFERS = 5;

/** Effective to-par for a golfer: a missed cut carries the cut penalty. */
export function effectiveScore(score: GolferScore): number {
  return score.missedCut ? score.score + CUT_PENALTY : score.score;
}

/**
 * The set of tier numbers whose golfers count toward the team total — the
 * best five effective scores (lowest). Mirrors lib/scoring's counting rule
 * for display only; no backend involvement.
 */
export function countingTiers(golfers: TeamGolfer[]): Set<number> {
  const counting = [...golfers]
    .sort((a, b) => effectiveScore(a.score) - effectiveScore(b.score))
    .slice(0, COUNTING_GOLFERS)
    .map((g) => g.tier);
  return new Set(counting);
}
