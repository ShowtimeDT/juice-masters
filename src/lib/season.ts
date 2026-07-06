import { TournamentId, TOURNAMENTS } from "./tournaments";

export interface SeasonTournamentResult {
  tournamentId: TournamentId;
  shortName: string;
  countingScore: number | null;
  rank: number | null;
  /** True when this is a missed-major penalty (worst team that major + 5), not a real score. */
  isPenalty?: boolean;
}

/** Points added on top of the worst team's score when a member missed a major. */
export const MISSED_MAJOR_PENALTY = 5;

export interface SeasonStanding {
  owner: string;
  teamName?: string;
  teamPhoto?: string | null;
  tournamentResults: SeasonTournamentResult[];
  totalScore: number;
  completedTournaments: number;
  rank: number;
}

export interface SeasonMember {
  display_name: string;
  team_name: string | null;
  team_photo: string | null;
}

/**
 * Season standings for a league, pure and testable — the data fetching lives
 * in useSeasonData, which feeds this per-major score maps.
 *
 * - `tournamentScores`: for each played major, owner display name → counting score.
 *   Majors absent from the map haven't been played and show as blank.
 * - `worstByTournament`: the worst (highest) counting score per played major —
 *   a member who skipped that major is charged that score + MISSED_MAJOR_PENALTY.
 */
export function buildSeasonStandings(
  members: SeasonMember[],
  tournamentScores: Map<TournamentId, Map<string, number>>,
  worstByTournament: Map<TournamentId, number>
): SeasonStanding[] {
  const tournamentConfigs = TOURNAMENTS.filter((t) => t.id !== "season");

  const seasonStandings: SeasonStanding[] = members.map((member) => {
    const tournamentResults: SeasonTournamentResult[] = tournamentConfigs.map((t) => {
      const scoreMap = tournamentScores.get(t.id);
      // No standings yet → that major hasn't been played; show nothing.
      if (!scoreMap) {
        return {
          tournamentId: t.id,
          shortName: t.shortName,
          countingScore: null,
          rank: null,
          isPenalty: false,
        };
      }
      const own = scoreMap.get(member.display_name);
      if (own != null) {
        return {
          tournamentId: t.id,
          shortName: t.shortName,
          countingScore: own,
          rank: null,
          isPenalty: false,
        };
      }
      // Major was played but this member never drafted a team → penalty:
      // the worst team's score for that major, plus 5.
      const worst = worstByTournament.get(t.id) ?? 0;
      return {
        tournamentId: t.id,
        shortName: t.shortName,
        countingScore: worst + MISSED_MAJOR_PENALTY,
        rank: null,
        isPenalty: true,
      };
    });

    const totalScore = tournamentResults.reduce((sum, r) => sum + (r.countingScore ?? 0), 0);
    const completedTournaments = tournamentResults.filter((r) => r.countingScore !== null).length;

    return {
      owner: member.display_name,
      teamName: member.team_name || member.display_name,
      teamPhoto: member.team_photo ?? null,
      tournamentResults,
      totalScore,
      completedTournaments,
      rank: 0,
    };
  });

  // Sort by total score ascending (lower is better), then assign ranks with ties.
  seasonStandings.sort((a, b) => a.totalScore - b.totalScore);
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
