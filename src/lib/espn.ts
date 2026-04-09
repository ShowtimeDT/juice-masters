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
    if (roundData && roundData.displayValue) {
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
    } else if (roundData && !roundData.displayValue) {
      // Round exists but no score yet (future round placeholder)
      break;
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

  // Detect missed cut
  // After round 2, if golfer only has 2 rounds of data and current round > 2
  const missedCut = currentRound > 2 && rounds.length <= 2 && rounds.length > 0;

  const position = competitor.sortOrder?.toString() || "-";

  return {
    name,
    espnId,
    score,
    scoreDisplay,
    rounds,
    birdies,
    missedCut,
    position,
    thru,
  };
}
/* eslint-enable @typescript-eslint/no-explicit-any */

export async function fetchTournamentData(): Promise<TournamentData> {
  const res = await fetch("/api/scores", { cache: "no-store" });
  if (!res.ok) {
    throw new Error(`Failed to fetch scores: ${res.status}`);
  }
  const data = await res.json();

  const event = data.events?.[0];
  const competition = event?.competitions?.[0];
  const competitors = competition?.competitors || [];

  const tournamentName = event?.name || "The Masters";

  // Determine current round
  const statusDetail = event?.status?.type?.detail || "";
  const roundNum = event?.status?.period || 1;
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

  return {
    name: tournamentName,
    status: statusState,
    roundStatus,
    totalBirdies,
    golferScores,
  };
}
