import { GolferScore, RoundScore, TournamentData } from "./types";

function parseScore(score: string | undefined | null): number {
  if (!score || score === "-" || score === "") return 0;
  if (score === "E") return 0;
  return parseInt(score, 10);
}

function parseScoreDisplay(score: string | undefined | null): string {
  if (!score || score === "-" || score === "") return "E";
  return score;
}

/* eslint-disable @typescript-eslint/no-explicit-any */
function extractGolfer(competitor: any, currentRound: number): GolferScore {
  const name: string = competitor.athlete?.fullName || competitor.athlete?.displayName || "Unknown";
  const espnId: string = competitor.id?.toString() || "";
  const scoreStr: string = competitor.score?.displayValue ?? competitor.score ?? "-";
  const score = parseScore(scoreStr);
  const scoreDisplay = parseScoreDisplay(scoreStr);

  const linescores = competitor.linescores || [];

  // Extract round scores and determine thru
  // linescores[i] = round i+1 data
  // linescores[i].linescores = hole-by-hole scores for that round
  // linescores[i].displayValue = round score relative to par
  const rounds: RoundScore[] = [];
  let thru = "-"; // hasn't started

  for (let i = 0; i < 4; i++) {
    const roundData = linescores[i];
    if (!roundData) break;
    // ESPN includes a placeholder round entry for the current round before
    // a golfer tees off (and for missed-cut golfers it stays as "-"). Treat
    // a missing or "-" displayValue as "no real round here" and stop.
    if (!roundData.displayValue || roundData.displayValue === "-") break;

    const holeScores = roundData.linescores || [];
    const holesPlayed = holeScores.length;

    rounds.push({
      round: i + 1,
      score: roundData.displayValue,
    });

    // Determine thru based on the latest active round
    if (i + 1 === currentRound || (i + 1 === linescores.length && !linescores[i + 1])) {
      // This is the current/latest round for this golfer
      if (holesPlayed >= 18) {
        thru = "F";
      } else if (holesPlayed > 0) {
        thru = holesPlayed.toString();
      }
    }
  }

  // If golfer has completed all their rounds up through current round, they're F
  // If they have round data for the current round with 18 holes, they're F
  const latestRoundWithData = rounds.length;
  if (latestRoundWithData > 0 && latestRoundWithData < currentRound) {
    // They finished earlier rounds but current round hasn't started for them
    thru = "-";
  }
  if (latestRoundWithData > 0) {
    const latestRound = linescores[latestRoundWithData - 1];
    const holesInLatest = latestRound?.linescores?.length || 0;
    if (holesInLatest >= 18) {
      thru = "F";
    } else if (holesInLatest > 0) {
      thru = holesInLatest.toString();
    }
  }

  // Count birdies from hole-by-hole scores (scoreType.displayValue === '-1')
  let birdies = 0;
  for (const roundData of linescores) {
    const holes = roundData?.linescores || [];
    for (const hole of holes) {
      if (hole?.scoreType?.displayValue === "-1") {
        birdies++;
      }
    }
  }

  // missedCut is set in a second pass by detectMissedCuts() once we know the
  // tournament's cut score from ESPN's core API.
  const position = competitor.sortOrder?.toString() || "-";

  return {
    name,
    espnId,
    score,
    scoreDisplay,
    rounds,
    birdies,
    missedCut: false,
    position,
    thru,
  };
}
/* eslint-enable @typescript-eslint/no-explicit-any */

// Apply the +10 missed-cut penalty using ESPN's authoritative cut score.
// Anyone whose 36-hole total is strictly worse than the cut line missed the
// cut. Anyone who didn't even complete 36 holes (WD/DQ before the cut) is
// also flagged so they pick up the penalty too.
function detectMissedCuts(
  golferScores: Map<string, GolferScore>,
  currentRound: number,
  cutRound: number,
  cutScore: number | null | undefined
): void {
  if (currentRound <= cutRound) return;
  if (cutScore == null) return;

  for (const g of golferScores.values()) {
    if (g.rounds.length < 2) {
      // WD or DQ before the cut was made — apply the penalty too.
      g.missedCut = true;
      continue;
    }
    const total =
      parseScore(g.rounds[0].score) + parseScore(g.rounds[1].score);
    if (total > cutScore) {
      g.missedCut = true;
    }
  }
}

export async function fetchTournamentData(espnDatesParam?: string): Promise<TournamentData> {
  const url = espnDatesParam ? `/api/scores?dates=${espnDatesParam}` : "/api/scores";
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) {
    throw new Error(`Failed to fetch scores: ${res.status}`);
  }
  const data = await res.json();

  const event = data.events?.[0];
  const competition = event?.competitions?.[0];
  const competitors = competition?.competitors || [];
  const tournamentMeta = event?.tournamentMeta;

  const tournamentName = event?.name || "The Masters";

  // Determine current round. ESPN's site-API scoreboard does NOT expose
  // status.period on the event itself — the real round number lives on the
  // core-API tournament metadata (injected by /api/scores) or, as a fallback,
  // on competition.status.period.
  const statusDetail = event?.status?.type?.detail || "";
  const roundNum =
    tournamentMeta?.currentRound ??
    competition?.status?.period ??
    event?.status?.period ??
    1;
  const statusState = event?.status?.type?.state || "pre";
  let roundStatus = statusDetail;
  if (statusState === "pre") {
    roundStatus = "Tournament has not started";
  }

  // Parse all golfers
  const golferScores = new Map<string, GolferScore>();
  let totalBirdies = 0;

  for (const c of competitors) {
    const golfer = extractGolfer(c, roundNum);
    golferScores.set(golfer.name, golfer);
    totalBirdies += golfer.birdies;
  }

  // Apply missed-cut penalties using ESPN's authoritative cut line.
  detectMissedCuts(
    golferScores,
    roundNum,
    tournamentMeta?.cutRound ?? 2,
    tournamentMeta?.cutScore
  );

  return {
    name: tournamentName,
    status: statusState,
    roundStatus,
    totalBirdies,
    golferScores,
  };
}
