"use client";

import { useState, useEffect, useCallback } from "react";
import { TournamentId, TOURNAMENTS } from "@/lib/tournaments";
import { fetchTournamentData } from "@/lib/espn";
import { Entry, TournamentData } from "@/lib/types";
import { SeasonStanding } from "@/lib/season";
import { calculateStandings } from "@/lib/scoring";

interface LeagueMember {
  user_id: string;
  display_name: string;
}

export function useSeasonData(leagueId?: string, intervalMs = 120_000) {
  const [standings, setStandings] = useState<SeasonStanding[]>([]);
  const [totalBirdies, setTotalBirdies] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!leagueId) {
      setIsLoading(false);
      return;
    }

    try {
      // Fetch league members — these always show on the leaderboard
      const leagueRes = await fetch(`/api/leagues/${leagueId}`);
      const leagueData = await leagueRes.json();
      const members: LeagueMember[] = leagueData.members || [];

      const tournamentConfigs = TOURNAMENTS.filter((t) => t.id !== "season");

      // For each tournament, try to get locked draft entries + ESPN data
      const tournamentStandings = new Map<TournamentId, Map<string, number>>();
      let birdies = 0;

      for (const t of tournamentConfigs) {
        try {
          const draftRes = await fetch(`/api/draft/tournament/${t.id}?league_id=${leagueId}`);
          const draftData = await draftRes.json();

          if (!draftData?.draft || draftData.draft.status !== "locked") continue;

          const entriesRes = await fetch(`/api/draft/${draftData.draft.id}/entries`);
          if (!entriesRes.ok) continue;
          const entries: Entry[] = await entriesRes.json();
          if (entries.length === 0) continue;

          const espnData: TournamentData = await fetchTournamentData(t.espnDatesParam);
          birdies += espnData.totalBirdies;

          const standings = calculateStandings(entries, espnData);
          const scoreMap = new Map<string, number>();
          for (const s of standings) {
            scoreMap.set(s.entry.owner, s.countingScore);
          }
          tournamentStandings.set(t.id as TournamentId, scoreMap);
        } catch {
          // Skip this tournament
        }
      }

      // Build season standings from ALL league members
      const seasonStandings: SeasonStanding[] = members.map((member) => {
        const tournamentResults = tournamentConfigs.map((t) => {
          const scoreMap = tournamentStandings.get(t.id as TournamentId);
          const score = scoreMap?.get(member.display_name) ?? null;
          return {
            tournamentId: t.id as TournamentId,
            shortName: t.shortName,
            countingScore: score,
            rank: null,
          };
        });

        const totalScore = tournamentResults.reduce((sum, r) => sum + (r.countingScore ?? 0), 0);
        const completedTournaments = tournamentResults.filter((r) => r.countingScore !== null).length;

        return {
          owner: member.display_name,
          tournamentResults,
          totalScore,
          completedTournaments,
          rank: 0,
        };
      });

      // Sort by total score ascending
      seasonStandings.sort((a, b) => a.totalScore - b.totalScore);

      // Assign ranks
      let currentRank = 1;
      for (let i = 0; i < seasonStandings.length; i++) {
        if (i > 0 && seasonStandings[i].totalScore === seasonStandings[i - 1].totalScore) {
          seasonStandings[i].rank = seasonStandings[i - 1].rank;
        } else {
          seasonStandings[i].rank = currentRank;
        }
        currentRank = i + 2;
      }

      setStandings(seasonStandings);
      setTotalBirdies(birdies);
      setLastUpdated(new Date());
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch season data");
    } finally {
      setIsLoading(false);
    }
  }, [leagueId]);

  useEffect(() => {
    refresh();
    const interval = setInterval(refresh, intervalMs);
    return () => clearInterval(interval);
  }, [refresh, intervalMs]);

  return { standings, totalBirdies, isLoading, lastUpdated, error, refresh };
}
