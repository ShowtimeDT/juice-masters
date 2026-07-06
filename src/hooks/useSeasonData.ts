"use client";

import { useState, useEffect, useCallback } from "react";
import { TournamentId, TOURNAMENTS } from "@/lib/tournaments";
import { fetchTournamentData } from "@/lib/espn";
import { Entry, TournamentData } from "@/lib/types";
import { SeasonStanding, SeasonMember, buildSeasonStandings } from "@/lib/season";
import { calculateStandings } from "@/lib/scoring";

interface LeagueMember extends SeasonMember {
  user_id: string;
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
      // Worst (highest = most over par) counting score among each major's teams —
      // the basis for the missed-major penalty (worst + 5).
      const worstByTournament = new Map<TournamentId, number>();
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

          const espnData: TournamentData = await fetchTournamentData(t.id);
          birdies += espnData.totalBirdies;

          const standings = calculateStandings(entries, espnData);
          const scoreMap = new Map<string, number>();
          for (const s of standings) {
            scoreMap.set(s.entry.owner, s.countingScore);
          }
          tournamentStandings.set(t.id as TournamentId, scoreMap);
          worstByTournament.set(
            t.id as TournamentId,
            Math.max(...standings.map((s) => s.countingScore))
          );
        } catch {
          // Skip this tournament
        }
      }

      // Build season standings from ALL league members (pure logic in lib/season.ts)
      setStandings(buildSeasonStandings(members, tournamentStandings, worstByTournament));
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
