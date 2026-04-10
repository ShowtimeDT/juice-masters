import { TournamentId, TOURNAMENTS } from "./tournaments";
import { getEntriesForTournament } from "./entries";
import { calculateStandings } from "./scoring";
import { EntryStanding, TournamentData } from "./types";

export interface SeasonTournamentResult {
  tournamentId: TournamentId;
  shortName: string;
  countingScore: number | null;
  rank: number | null;
}

export interface SeasonStanding {
  owner: string;
  tournamentResults: SeasonTournamentResult[];
  totalScore: number;
  completedTournaments: number;
  rank: number;
}

export function calculateSeasonStandings(
  tournamentDataMap: Map<TournamentId, TournamentData>
): SeasonStanding[] {
  // Calculate standings for each tournament that has entries and data
  const standingsMap = new Map<TournamentId, EntryStanding[]>();

  for (const tournament of TOURNAMENTS) {
    if (tournament.id === "season") continue;
    const entries = getEntriesForTournament(tournament.id);
    const data = tournamentDataMap.get(tournament.id);
    if (entries.length > 0 && data) {
      standingsMap.set(tournament.id, calculateStandings(entries, data));
    }
  }

  // Collect all unique owners across all tournaments
  const ownerSet = new Set<string>();
  for (const [, standings] of standingsMap) {
    for (const s of standings) {
      ownerSet.add(s.entry.owner);
    }
  }

  // Build season standings per owner
  const seasonStandings: SeasonStanding[] = [];

  for (const owner of ownerSet) {
    const tournamentResults: SeasonTournamentResult[] = [];
    let totalScore = 0;
    let completedTournaments = 0;

    for (const tournament of TOURNAMENTS) {
      if (tournament.id === "season") continue;

      const standings = standingsMap.get(tournament.id);
      const standing = standings?.find((s) => s.entry.owner === owner);

      if (standing) {
        tournamentResults.push({
          tournamentId: tournament.id,
          shortName: tournament.shortName,
          countingScore: standing.countingScore,
          rank: standing.rank,
        });
        totalScore += standing.countingScore;
        completedTournaments++;
      } else {
        tournamentResults.push({
          tournamentId: tournament.id,
          shortName: tournament.shortName,
          countingScore: null,
          rank: null,
        });
      }
    }

    seasonStandings.push({
      owner,
      tournamentResults,
      totalScore,
      completedTournaments,
      rank: 0,
    });
  }

  // Sort by total score ascending (lower is better)
  seasonStandings.sort((a, b) => a.totalScore - b.totalScore);

  // Assign ranks with tie handling
  let currentRank = 1;
  for (let i = 0; i < seasonStandings.length; i++) {
    if (i > 0 && seasonStandings[i].totalScore === seasonStandings[i - 1].totalScore) {
      seasonStandings[i].rank = seasonStandings[i - 1].rank;
    } else {
      seasonStandings[i].rank = currentRank;
    }
    currentRank = i + 2;
  }

  return seasonStandings;
}
