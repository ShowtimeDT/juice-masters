"use client";

import { useSeasonData } from "@/hooks/useSeasonData";
import { getTournament, TOURNAMENTS } from "@/lib/tournaments";
import { formatScore, scoreColor, rankSuffix } from "@/lib/format";
import TournamentHeader from "./TournamentHeader";

const TOURNAMENT_COLUMNS = TOURNAMENTS.filter((t) => t.id !== "season");
const SEASON = getTournament("season");

/** Score text, or a faint em dash when the member hasn't played. */
function ScoreCell({ score, className = "" }: { score: number | null; className?: string }) {
  if (score === null) {
    return <span className={`font-mono text-faint ${className}`}>—</span>;
  }
  return (
    <span className={`font-mono ${scoreColor(score)} ${className}`}>
      {formatScore(score)}
    </span>
  );
}

interface SeasonLeaderboardProps {
  leagueId?: string;
}

export default function SeasonLeaderboard({ leagueId }: SeasonLeaderboardProps) {
  const { standings, isLoading, lastUpdated, error, refresh } = useSeasonData(leagueId);

  if (isLoading && standings.length === 0) {
    return (
      <div>
        <TournamentHeader
          tournament={SEASON}
          roundStatus="2026 Season"
          lastUpdated={null}
          onRefresh={() => {}}
        />
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <div
              className="inline-block w-8 h-8 border-2 border-t-transparent rounded-full animate-spin mb-4"
              style={{ borderColor: SEASON.theme.accent, borderTopColor: "transparent" }}
            />
            <p className="text-gray-400 text-sm">Loading season standings...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <TournamentHeader
        tournament={SEASON}
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
        {/* Season standings table */}
        <div className="bg-card rounded-lg border border-edge overflow-hidden">
          <div className="overflow-x-auto">
            <div className="min-w-[30rem]">
              {/* Column headers */}
              <div className="grid grid-cols-[3rem_1fr_repeat(4,4.5rem)_5rem] px-3 sm:px-4 py-2 text-[10px] uppercase tracking-wider text-faint font-semibold border-b border-edge">
                <span className="text-center">Rank</span>
                <span>Player</span>
                {TOURNAMENT_COLUMNS.map((t) => (
                  <span key={t.id} className="text-center">{t.shortName}</span>
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
                    <span className="text-lg font-serif italic font-bold text-ink">
                      {standing.rank}
                    </span>
                    <span className="text-[10px] font-serif italic text-ink">
                      {rankSuffix(standing.rank)}
                    </span>
                  </div>

                  {/* Name */}
                  <span className="text-white font-medium truncate">{standing.owner}</span>

                  {/* Per-tournament scores */}
                  {standing.tournamentResults.map((tr) => (
                    <ScoreCell
                      key={tr.tournamentId}
                      score={tr.countingScore}
                      className="text-center text-sm"
                    />
                  ))}

                  {/* Total */}
                  <ScoreCell
                    score={standing.completedTournaments > 0 ? standing.totalScore : null}
                    className="text-right font-bold text-lg"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>

        <footer className="text-center text-gray-600 text-xs py-6">
          Auto-refreshes every 2 minutes
        </footer>
      </main>
    </div>
  );
}
