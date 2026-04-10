"use client";

import { useState, useEffect, useCallback } from "react";
import { TournamentId, TOURNAMENTS } from "@/lib/tournaments";
import { getEntriesForTournament } from "@/lib/entries";
import { fetchTournamentData } from "@/lib/espn";
import { TournamentData } from "@/lib/types";
import { calculateSeasonStandings, SeasonStanding } from "@/lib/season";

export function useSeasonData(intervalMs = 120_000) {
  const [standings, setStandings] = useState<SeasonStanding[]>([]);
  const [totalBirdies, setTotalBirdies] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      // Find tournaments that have entries
      const tournamentsWithEntries = TOURNAMENTS.filter(
        (t) => t.id !== "season" && getEntriesForTournament(t.id).length > 0
      );

      // Fetch data for all tournaments with entries in parallel
      const results = await Promise.allSettled(
        tournamentsWithEntries.map(async (t) => {
          const data = await fetchTournamentData(t.espnDatesParam);
          return { id: t.id as TournamentId, data };
        })
      );

      const dataMap = new Map<TournamentId, TournamentData>();
      let birdies = 0;

      for (const result of results) {
        if (result.status === "fulfilled") {
          dataMap.set(result.value.id, result.value.data);
          birdies += result.value.data.totalBirdies;
        }
      }

      const seasonStandings = calculateSeasonStandings(dataMap);
      setStandings(seasonStandings);
      setTotalBirdies(birdies);
      setLastUpdated(new Date());
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch season data");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
    const interval = setInterval(refresh, intervalMs);
    return () => clearInterval(interval);
  }, [refresh, intervalMs]);

  return { standings, totalBirdies, isLoading, lastUpdated, error, refresh };
}
