"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { TournamentData } from "@/lib/types";
import { fetchTournamentData } from "@/lib/espn";
import { TournamentId } from "@/lib/tournaments";

export function useAutoRefresh(tournamentId: TournamentId, intervalMs = 120_000) {
  const [data, setData] = useState<TournamentData | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const prevTournamentId = useRef(tournamentId);

  // Reset when switching tournaments so the old leaderboard doesn't flash
  // while the new one loads (the league page swaps tabs without remounting).
  if (prevTournamentId.current !== tournamentId) {
    prevTournamentId.current = tournamentId;
    setData(null);
    setIsLoading(true);
    setError(null);
  }

  const refresh = useCallback(async () => {
    try {
      const tournament = await fetchTournamentData(tournamentId);
      setData(tournament);
      setLastUpdated(new Date());
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch scores");
      // Don't clear existing data on error
    } finally {
      setIsLoading(false);
    }
  }, [tournamentId]);

  useEffect(() => {
    refresh();
    const interval = setInterval(refresh, intervalMs);
    return () => clearInterval(interval);
  }, [refresh, intervalMs]);

  return { data, lastUpdated, isLoading, error, refresh };
}
