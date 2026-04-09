"use client";

import { useState, useEffect, useCallback } from "react";
import { TournamentData } from "@/lib/types";
import { fetchTournamentData } from "@/lib/espn";

export function useAutoRefresh(intervalMs = 120_000) {
  const [data, setData] = useState<TournamentData | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      const tournament = await fetchTournamentData();
      setData(tournament);
      setLastUpdated(new Date());
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch scores");
      // Don't clear existing data on error
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
    const interval = setInterval(refresh, intervalMs);
    return () => clearInterval(interval);
  }, [refresh, intervalMs]);

  return { data, lastUpdated, isLoading, error, refresh };
}
