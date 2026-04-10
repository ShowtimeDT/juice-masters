"use client";

import { useAutoRefresh } from "@/hooks/useAutoRefresh";
import { getEntriesForTournament } from "@/lib/entries";
import { calculateStandings } from "@/lib/scoring";
import { TournamentConfig } from "@/lib/tournaments";
import TournamentHeader from "./TournamentHeader";
import EntryRow from "./EntryRow";
import TiebreakerPanel from "./TiebreakerPanel";

interface LeaderboardProps {
  config: TournamentConfig;
}

export default function Leaderboard({ config }: LeaderboardProps) {
  const { data, lastUpdated, isLoading, error, refresh } = useAutoRefresh(config.espnDatesParam);
  const entries = getEntriesForTournament(config.id);

  if (isLoading && !data) {
    return (
      <div className="min-h-screen bg-[#1a1a1a] flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block w-8 h-8 border-2 border-t-transparent rounded-full animate-spin mb-4" style={{ borderColor: config.theme.primary, borderTopColor: 'transparent' }} />
          <p className="text-gray-400 text-sm">Loading scores...</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-[#1a1a1a] flex items-center justify-center">
        <div className="text-center px-4">
          <p className="text-red-400 text-sm mb-2">Unable to load scores</p>
          <p className="text-gray-500 text-xs">{error}</p>
          <button
            onClick={refresh}
            className="mt-4 px-4 py-2 text-white text-sm rounded-lg transition-colors cursor-pointer"
            style={{ backgroundColor: config.theme.primary }}
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  const standings = calculateStandings(entries, data);

  return (
    <div>
      <TournamentHeader
        tournamentName={config.name}
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
        {standings.map((standing) => (
          <EntryRow
            key={standing.entry.id}
            standing={standing}
          />
        ))}

        <div className="pt-4">
          <TiebreakerPanel
            standings={standings}
            actualBirdies={data.totalBirdies}
          />
        </div>
      </main>

      <footer className="text-center text-gray-600 text-xs py-6">
        Auto-refreshes every 2 minutes
      </footer>
    </div>
  );
}
