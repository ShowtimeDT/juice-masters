"use client";

import { useSeasonData } from "@/hooks/useSeasonData";
import { useTheme } from "@/lib/ThemeContext";
import TournamentHeader from "./TournamentHeader";

function formatScore(score: number): string {
  if (score === 0) return "E";
  if (score > 0) return `+${score}`;
  return score.toString();
}

function scoreColor(score: number): string {
  if (score < 0) return "#4ade80";
  if (score > 0) return "#f87171";
  return "#d4d4d4";
}

function rankSuffix(rank: number): string {
  if (rank === 1) return "st";
  if (rank === 2) return "nd";
  if (rank === 3) return "rd";
  return "th";
}

interface SeasonLeaderboardProps {
  leagueId?: string;
}

export default function SeasonLeaderboard({ leagueId }: SeasonLeaderboardProps) {
  const theme = useTheme();
  const { standings, isLoading, lastUpdated, error, refresh } = useSeasonData(leagueId);

  if (isLoading && standings.length === 0) {
    return (
      <div>
        <TournamentHeader
          tournamentName="Juice Tour"
          roundStatus="2026 Season"
          lastUpdated={null}
          onRefresh={() => {}}
        />
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <div className="inline-block w-8 h-8 border-2 border-t-transparent rounded-full animate-spin mb-4" style={{ borderColor: theme.accent, borderTopColor: 'transparent' }} />
            <p className="text-gray-400 text-sm">Loading season standings...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <TournamentHeader
        tournamentName="Juice Tour"
        roundStatus="2026 Season"
        lastUpdated={lastUpdated}
        onRefresh={refresh}
      />

      {error && (
        <div className="max-w-5xl mx-auto px-4 mt-4">
          <div className="bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-2 text-red-400 text-xs">
            {error}
          </div>
        </div>
      )}

      <main className="max-w-5xl mx-auto px-4 py-8">
        {standings.length === 0 && !isLoading && (
          <div className="bg-[#1e2124] rounded-lg border border-[#3a3e3a] p-8 text-center">
            <p className="text-gray-400 text-sm">No tournament results yet.</p>
            <p className="text-gray-500 text-xs mt-1">Season standings will appear once a tournament draft is locked and the tournament begins.</p>
          </div>
        )}

        {/* Season standings table */}
        {standings.length > 0 && <div className="bg-[#1e2124] rounded-lg border border-[#3a3e3a] overflow-hidden">
          {/* Column headers */}
          <div className="overflow-x-auto">
            <div className="min-w-[30rem]">
              <div className="grid grid-cols-[3rem_1fr_repeat(4,4.5rem)_5rem] px-3 sm:px-4 py-2 text-[10px] uppercase tracking-wider text-[#5a5e5a] font-semibold border-b border-[#3a3e3a]">
                <span className="text-center">Rank</span>
                <span>Player</span>
                {standings[0]?.tournamentResults.map((tr) => (
                  <span key={tr.tournamentId} className="text-center">{tr.shortName}</span>
                ))}
                <span className="text-right">Total</span>
              </div>

              {/* Rows */}
              {standings.map((standing) => (
                <div
                  key={standing.owner}
                  className="grid grid-cols-[3rem_1fr_repeat(4,4.5rem)_5rem] items-center px-3 sm:px-4 py-3 text-sm border-b border-white/5 last:border-0"
                >
                  {/* Rank */}
                  <div className="text-center">
                    <span className="text-lg font-serif italic font-bold text-[#d4d4d4]">
                      {standing.rank}
                    </span>
                    <span className="text-[10px] font-serif italic text-[#d4d4d4]">
                      {rankSuffix(standing.rank)}
                    </span>
                  </div>

                  {/* Name */}
                  <span className="text-white font-medium truncate">{standing.owner}</span>

                  {/* Per-tournament scores */}
                  {standing.tournamentResults.map((tr) => (
                    <span
                      key={tr.tournamentId}
                      className="text-center font-mono text-sm"
                      style={{ color: tr.countingScore !== null ? scoreColor(tr.countingScore) : "#5a5e5a" }}
                    >
                      {tr.countingScore !== null ? formatScore(tr.countingScore) : "—"}
                    </span>
                  ))}

                  {/* Total */}
                  <span
                    className="text-right font-mono font-bold text-lg"
                    style={{ color: scoreColor(standing.totalScore) }}
                  >
                    {formatScore(standing.totalScore)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>}

        <footer className="text-center text-gray-600 text-xs py-6">
          Auto-refreshes every 2 minutes
        </footer>
      </main>
    </div>
  );
}
