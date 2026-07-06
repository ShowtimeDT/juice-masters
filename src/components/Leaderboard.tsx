"use client";

import { useAutoRefresh } from "@/hooks/useAutoRefresh";
import { getEntriesForTournament } from "@/lib/entries/index";
import { calculateStandings } from "@/lib/scoring";
import { getTournament, TournamentId } from "@/lib/tournaments";
import { Entry } from "@/lib/types";
import EventHeader from "./EventHeader";
import EntryRow from "./EntryRow";
import TiebreakerPanel from "./TiebreakerPanel";
import ChampionBanner from "./ChampionBanner";

interface LeaderboardProps {
  tournamentId: TournamentId;
  /** Override the static entries (the draft system injects converted picks). */
  entries?: Entry[];
  onSelectMajor?: (id: TournamentId) => void;
  onSeasonStandings?: () => void;
}

export default function Leaderboard({
  tournamentId,
  entries: entriesProp,
  onSelectMajor,
  onSeasonStandings,
}: LeaderboardProps) {
  const { data, isLoading, error, refresh } = useAutoRefresh(tournamentId);
  const tournament = getTournament(tournamentId);
  const entries = entriesProp ?? getEntriesForTournament(tournamentId);

  if (isLoading && !data) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block w-8 h-8 border-2 border-gold border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-muted text-sm">Loading scores…</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <div className="text-center px-4">
          <p className="text-rose text-sm mb-2">Unable to load scores</p>
          <p className="text-faint text-xs">{error}</p>
          <button
            onClick={refresh}
            className="mt-4 btn-gold px-5 py-2 text-sm rounded-xl cursor-pointer"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  const standings = calculateStandings(entries, data);
  const isLive = data.status === "in";
  const isFinal = data.status === "post";

  return (
    <div className="min-h-screen bg-surface">
      <EventHeader
        config={tournament}
        subStatus={data.roundStatus}
        isLive={isLive}
        onSelectMajor={onSelectMajor}
        onSeasonStandings={onSeasonStandings}
      />

      {error && (
        <div className="max-w-[1080px] mx-auto px-6 mt-4">
          <div className="bg-rose/10 border border-rose/20 rounded-lg px-4 py-2 text-rose text-xs">
            Scores may be outdated. {error}
          </div>
        </div>
      )}

      <main className="max-w-[1080px] mx-auto px-6 pb-20">
        {standings.length === 0 ? (
          <div className="bg-card border border-edge rounded-2xl px-6 py-12 text-center mt-8">
            <p className="text-text text-sm">No entries yet for the {tournament.shortName}.</p>
            <p className="text-faint text-xs mt-2">
              Picks will appear here once they&apos;re finalized.
            </p>
          </div>
        ) : (
          <>
            {isFinal && (
              <div className="pt-7">
                <ChampionBanner standing={standings[0]} />
              </div>
            )}
            <div className="text-right text-[11px] tracking-[1.8px] uppercase text-faint px-1.5 pt-6 pb-4">
              {isFinal ? "Final · best 5 of 8 counted" : "Best 5 of 8 scores count"}
            </div>
            <div className="space-y-[13px]">
              {standings.map((standing) => (
                <EntryRow key={standing.entry.id} standing={standing} />
              ))}
            </div>

            <div className="mt-[34px]">
              <TiebreakerPanel standings={standings} actualBirdies={data.totalBirdies} />
            </div>
          </>
        )}
      </main>
    </div>
  );
}
