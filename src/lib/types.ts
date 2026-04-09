export interface Entry {
  id: string;
  name: string;
  owner: string;
  golfers: string[]; // 8 golfers, 1 per tier
  tiebreakerGuess: number;
}

export interface GolferScore {
  name: string;
  espnId: string; // ESPN athlete ID for headshot URLs
  score: number; // numeric relative to par
  scoreDisplay: string; // "E", "-3", "+2"
  rounds: RoundScore[];
  birdies: number;
  missedCut: boolean;
  position: string;
  thru: string; // "F", "B9", hole number, etc.
}

export interface RoundScore {
  round: number;
  score: string;
}

export interface GolferScoreWithCounting extends GolferScore {
  effectiveScore: number;
  isCounting: boolean;
  tier: number;
}

export interface EntryStanding {
  entry: Entry;
  golferScores: GolferScoreWithCounting[];
  countingScore: number;
  rank: number;
}

export interface TournamentData {
  name: string;
  status: string;
  roundStatus: string;
  totalBirdies: number;
  golferScores: Map<string, GolferScore>;
}
