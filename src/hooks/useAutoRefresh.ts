"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { TournamentData } from "@/lib/types";
import { fetchTournamentData } from "@/lib/espn";

export function useAutoRefresh(espnDatesParam?: string, intervalMs = 120_000) {
  const [data, setData] = useState<TournamentData | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const prevDatesParam = useRef(espnDatesParam);

  const refresh = useCallback(async () => {
    try {
      const tournament = await fetchTournamentData(espnDatesParam);
      setData(tournament);
      setLastUpdated(new Date());
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch scores");
    } finally {
      setIsLoading(false);
    }
  }, [espnDatesParam]);

  // Reset state when tournament changes
  useEffect(() => {
    if (prevDatesParam.current !== espnDatesParam) {
      setData(null);
      setIsLoading(true);
      setError(null);
      prevDatesParam.current = espnDatesParam;
    }
  }, [espnDatesParam]);

  useEffect(() => {
    refresh();
    const interval = setInterval(refresh, intervalMs);
    return () => clearInterval(interval);
  }, [refresh, intervalMs]);

  return { data, lastUpdated, isLoading, error, refresh };
}
