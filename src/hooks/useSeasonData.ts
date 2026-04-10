"use client";

import { useState, useEffect, useCallback } from "react";
import { TournamentId, TOURNAMENTS } from "@/lib/tournaments";
import { fetchTournamentData } from "@/lib/espn";
import { Entry, TournamentData } from "@/lib/types";
import { calculateSeasonStandings, SeasonStanding } from "@/lib/season";
import { calculateStandings } from "@/lib/scoring";

export function useSeasonData(leagueId?: string, intervalMs = 120_000) {
  const [standings, setStandings] = useState<SeasonStanding[]>([]);
  const [totalBirdies, setTotalBirdies] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      const tournamentConfigs = TOURNAMENTS.filter((t) => t.id !== "season");
      const tournamentDataMap = new Map<TournamentId, TournamentData>();
      let birdies = 0;

      // For each tournament, check if the league has a locked draft with entries
      for (const t of tournamentConfigs) {
        try {
          const leagueParam = leagueId ? `?league_id=${leagueId}` : "";
          const draftRes = await fetch(`/api/draft/tournament/${t.id}${leagueParam}`);
          const draftData = await draftRes.json();

          if (!draftData?.draft) continue;

          // Get entries: if draft is locked, fetch from entries API
          let entries: Entry[] = [];
          if (draftData.draft.status === "locked") {
            const entriesRes = await fetch(`/api/draft/${draftData.draft.id}/entries`);
            if (entriesRes.ok) {
              entries = await entriesRes.json();
            }
          }

          if (entries.length === 0) continue;

          // Fetch ESPN tournament data
          const espnData = await fetchTournamentData(t.espnDatesParam);
          tournamentDataMap.set(t.id as TournamentId, espnData);
          birdies += espnData.totalBirdies;

          // Calculate standings for this tournament and store in the map
          // (calculateSeasonStandings expects the data map, it calls calculateStandings internally)
        } catch {
          // Skip this tournament if fetch fails
        }
      }

      // For season standings, we need entries per tournament too
      // Refetch and calculate properly
      const standingsMap = new Map<TournamentId, ReturnType<typeof calculateStandings>>();

      for (const t of tournamentConfigs) {
        try {
          const leagueParam = leagueId ? `?league_id=${leagueId}` : "";
          const draftRes = await fetch(`/api/draft/tournament/${t.id}${leagueParam}`);
          const draftData = await draftRes.json();

          if (!draftData?.draft || draftData.draft.status !== "locked") continue;

          const entriesRes = await fetch(`/api/draft/${draftData.draft.id}/entries`);
          if (!entriesRes.ok) continue;
          const entries: Entry[] = await entriesRes.json();
          if (entries.length === 0) continue;

          const espnData = tournamentDataMap.get(t.id as TournamentId);
          if (!espnData) continue;

          standingsMap.set(t.id as TournamentId, calculateStandings(entries, espnData));
        } catch {
          // Skip
        }
      }

      // Build season standings from the per-tournament standings
      const seasonStandings = calculateSeasonStandingsFromMap(standingsMap);
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

// Simplified season standings builder that works with pre-calculated standings
function calculateSeasonStandingsFromMap(
  standingsMap: Map<TournamentId, ReturnType<typeof calculateStandings>>
): SeasonStanding[] {
  const ownerSet = new Set<string>();
  for (const [, standings] of standingsMap) {
    for (const s of standings) {
      ownerSet.add(s.entry.owner);
    }
  }

  const tournaments = TOURNAMENTS.filter((t) => t.id !== "season");
  const seasonStandings: SeasonStanding[] = [];

  for (const owner of ownerSet) {
    const tournamentResults = tournaments.map((t) => {
      const standings = standingsMap.get(t.id as TournamentId);
      const standing = standings?.find((s) => s.entry.owner === owner);
      return {
        tournamentId: t.id as TournamentId,
        shortName: t.shortName,
        countingScore: standing?.countingScore ?? null,
        rank: standing?.rank ?? null,
      };
    });

    const totalScore = tournamentResults.reduce((sum, r) => sum + (r.countingScore ?? 0), 0);
    const completedTournaments = tournamentResults.filter((r) => r.countingScore !== null).length;

    seasonStandings.push({ owner, tournamentResults, totalScore, completedTournaments, rank: 0 });
  }

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
