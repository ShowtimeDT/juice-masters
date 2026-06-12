"use client";

import { useAutoRefresh } from "@/hooks/useAutoRefresh";
import { getEntriesForTournament } from "@/lib/entries/index";
import { calculateStandings } from "@/lib/scoring";
import { nameColumnWidthCh } from "@/lib/format";
import { getTournament, TournamentId } from "@/lib/tournaments";
import { Entry } from "@/lib/types";
import TournamentHeader from "./TournamentHeader";
import EntryRow from "./EntryRow";
import TiebreakerPanel from "./TiebreakerPanel";

interface LeaderboardProps {
  tournamentId: TournamentId;
  /** Override the static entries (the draft system injects converted picks). */
  entries?: Entry[];
}

export default function Leaderboard({ tournamentId, entries: entriesProp }: LeaderboardProps) {
  const { data, lastUpdated, isLoading, error, refresh } =
    useAutoRefresh(tournamentId);
  const tournament = getTournament(tournamentId);
  const entries = entriesProp ?? getEntriesForTournament(tournamentId);

  if (isLoading && !data) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <div className="text-center">
          <div
            className="inline-block w-8 h-8 border-2 border-t-transparent rounded-full animate-spin mb-4"
            style={{ borderColor: tournament.theme.primary, borderTopColor: "transparent" }}
          />
          <p className="text-gray-400 text-sm">Loading scores...</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <div className="text-center px-4">
          <p className="text-red-400 text-sm mb-2">Unable to load scores</p>
          <p className="text-gray-500 text-xs">{error}</p>
          <button
            onClick={refresh}
            className="mt-4 px-4 py-2 text-white text-sm rounded-lg transition-colors cursor-pointer"
            style={{ backgroundColor: tournament.theme.primary }}
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  const standings = calculateStandings(entries, data);
  const nameWidthCh = nameColumnWidthCh(standings.map((s) => s.entry.name));

  return (
    <div className="min-h-screen bg-surface">
      <TournamentHeader
        tournament={tournament}
        roundStatus={data.roundStatus}
        lastUpdated={lastUpdated}
        onRefresh={refresh}
      />

      {error && (
        <div className="max-w-5xl mx-auto px-4 mt-4">
          <div className="bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-2 text-red-400 text-xs">
            Scores may be outdated. {error}
          </div>
        </div>
      )}

      <main className="max-w-5xl mx-auto px-4 py-8 space-y-4">
        {standings.length === 0 ? (
          <div className="bg-card border border-white/5 rounded-lg px-6 py-12 text-center">
            <p className="text-gray-300 text-sm">
              No entries yet for the {tournament.shortName}.
            </p>
            <p className="text-gray-500 text-xs mt-2">
              Picks will appear here once they&apos;re finalized.
            </p>
          </div>
        ) : (
          <>
            {standings.map((standing) => (
              <EntryRow key={standing.entry.id} standing={standing} nameWidthCh={nameWidthCh} />
            ))}

            <div className="pt-4">
              <TiebreakerPanel
                standings={standings}
                actualBirdies={data.totalBirdies}
                accentColor={tournament.theme.accent}
              />
            </div>
          </>
        )}
      </main>

      <footer className="text-center text-gray-600 text-xs py-6">
        Auto-refreshes every 2 minutes
      </footer>
    </div>
  );
}
