"use client";

import { useSession } from "next-auth/react";
import { useSeasonData } from "@/hooks/useSeasonData";
import { getTournament, TOURNAMENTS, TournamentId } from "@/lib/tournaments";
import { getTournamentState } from "@/lib/tournament-state";
import { formatScore, scoreColor, rankSuffix } from "@/lib/format";

const TOURNAMENT_COLUMNS = TOURNAMENTS.filter((t) => t.id !== "season");

/** The major currently in progress (live dot + legend), or null between majors. */
const LIVE_MAJOR: TournamentId | null =
  TOURNAMENT_COLUMNS.find((t) => getTournamentState(t) === "in-progress")?.id ?? null;

/** Per-major score, or a faint em dash when that major hasn't been played.
 *  A missed major (penalty) renders in rose with a "*" mark so it reads
 *  differently from a real over-par score. Hidden on narrow screens. */
function MajorCell({ score, penalty }: { score: number | null; penalty?: boolean }) {
  if (score === null) {
    return (
      <span className="hidden sm:block text-center tnum text-[14px] font-normal text-faint">
        —
      </span>
    );
  }
  if (penalty) {
    return (
      <span
        className="hidden sm:block text-center tnum text-[14px] font-medium text-rose italic"
        title="Missed this major — scored the worst team's total + 5"
      >
        {formatScore(score)}
        <sup className="not-italic text-gold2 ml-px">*</sup>
      </span>
    );
  }
  return (
    <span
      className={`hidden sm:block text-center tnum text-[14px] font-medium ${scoreColor(score)}`}
    >
      {formatScore(score)}
    </span>
  );
}

interface SeasonLeaderboardProps {
  leagueId?: string;
  /** Skip the built-in hero when rendered under the persistent EventHeader. */
  hideHero?: boolean;
}

/** Centered serif hero matching the Season Standings design (no back nav — the
 *  parent page renders the "Back to {live major}" affordance). */
function SeasonHero() {
  return (
    <section className="relative overflow-hidden text-center px-6 pt-11 pb-9 border-b border-edge">
      <div
        className="pointer-events-none absolute left-1/2 -translate-x-1/2 -top-[30%] w-[760px] h-[420px]"
        style={{
          background:
            "radial-gradient(ellipse, rgba(201,162,75,0.13), transparent 66%)",
        }}
      />
      <div className="eyebrow relative">2026 Season</div>
      <h1 className="relative font-serif font-medium text-ink leading-none mt-2 text-[clamp(40px,6vw,62px)]">
        Season Standings
      </h1>
      <p className="relative text-[13.5px] tracking-[0.4px] text-muted mt-[11px]">
        Every score across all four majors — the season-long race for bragging
        rights.
      </p>
    </section>
  );
}

const COLS =
  "grid-cols-[34px_minmax(0,1fr)_64px] sm:grid-cols-[42px_minmax(0,1fr)_62px_62px_72px_72px_84px]";

export default function SeasonLeaderboard({ leagueId, hideHero = false }: SeasonLeaderboardProps) {
  const { standings, isLoading, lastUpdated, error, refresh } = useSeasonData(leagueId);
  const { data: session } = useSession();
  const myName = session?.user?.name ?? null;

  const liveLabel = LIVE_MAJOR ? getTournament(LIVE_MAJOR).shortName : null;
  const hasPenalty = standings.some((s) => s.tournamentResults.some((r) => r.isPenalty));

  if (isLoading && standings.length === 0) {
    return (
      <div>
        {!hideHero && <SeasonHero />}
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <div className="inline-block w-8 h-8 border-2 border-gold border-t-transparent rounded-full animate-spin mb-4" />
            <p className="text-muted text-sm">Loading season standings…</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      {!hideHero && <SeasonHero />}

      {error && (
        <div className="max-w-[980px] mx-auto px-6 mt-4">
          <div className="bg-rose/10 border border-rose/20 rounded-lg px-4 py-2 text-rose text-xs">
            {error}
          </div>
        </div>
      )}

      <main className="max-w-[980px] mx-auto px-6 pt-[26px] pb-20">
        {/* Legend — only while a major is live */}
        {liveLabel && (
          <div className="flex items-center justify-end gap-4 px-1.5 pb-3.5 text-[11px] tracking-[1.4px] uppercase text-faint">
            <span className="inline-flex items-center gap-1.5">
              <i className="w-1.5 h-1.5 rounded-full bg-sage inline-block" />
              {liveLabel} in progress
            </span>
          </div>
        )}

        {/* Column headers */}
        <div className={`grid ${COLS} items-center gap-3 px-5 pb-3`}>
          <span />
          <span className="text-left text-[10px] tracking-[1.3px] uppercase text-faint">
            Team
          </span>
          {TOURNAMENT_COLUMNS.map((t) => (
            <span
              key={t.id}
              className="hidden sm:block text-center text-[10px] tracking-[1.3px] uppercase text-faint"
            >
              {t.id === LIVE_MAJOR && (
                <span className="inline-block w-[5px] h-[5px] rounded-full bg-sage mr-1 align-middle" />
              )}
              {t.columnLabel}
            </span>
          ))}
          <span className="text-right text-[10px] tracking-[1.3px] uppercase text-faint">
            Season
          </span>
        </div>

        {/* Rows */}
        {standings.map((standing) => {
          const isYou = Boolean(myName) && standing.owner === myName;
          const isLead = standing.rank === 1;
          const label = standing.teamName || standing.owner;

          return (
            <div
              key={standing.owner}
              className={`grid ${COLS} items-center gap-3 rounded-2xl border px-5 py-3.5 mb-[11px] ${
                isYou
                  ? "border-gold/30 bg-[linear-gradient(180deg,rgba(201,162,75,0.05),transparent),var(--surface)]"
                  : isLead
                    ? "border-gold/30 bg-card"
                    : "border-edge bg-card"
              }`}
            >
              {/* Rank */}
              <span
                className={`font-serif text-[24px] leading-none text-center ${
                  isLead ? "text-gold" : "text-faint"
                }`}
              >
                {standing.rank}
                <sup className="font-serif italic text-[11px] ml-px">
                  {rankSuffix(standing.rank)}
                </sup>
              </span>

              {/* Team photo + name */}
              <div className="flex items-center gap-[13px] min-w-0">
                <span className="relative w-[38px] h-[38px] rounded-full overflow-hidden bg-surface2 shrink-0 shadow-[0_0_0_1px_var(--line)] inline-flex items-center justify-center">
                  {standing.teamPhoto ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={standing.teamPhoto}
                      alt={label}
                      className="absolute inset-0 w-full h-full object-cover"
                    />
                  ) : (
                    <span className="font-sans font-semibold text-[14px] text-gold2">
                      {label[0]?.toUpperCase()}
                    </span>
                  )}
                </span>
                <div className="min-w-0">
                  <b
                    className={`block font-serif font-medium text-[19px] leading-[1.12] truncate ${
                      isYou ? "text-gold2" : "text-ink"
                    }`}
                  >
                    {label}
                  </b>
                  {standing.teamName && standing.teamName !== standing.owner && (
                    <span className="block text-[11.5px] text-faint truncate">
                      {standing.owner}
                    </span>
                  )}
                </div>
              </div>

              {/* Per-major scores */}
              {standing.tournamentResults.map((tr) => (
                <MajorCell key={tr.tournamentId} score={tr.countingScore} penalty={tr.isPenalty} />
              ))}

              {/* Season total */}
              <span
                className={`text-right font-serif font-medium text-[28px] leading-none tnum ${
                  standing.completedTournaments > 0
                    ? scoreColor(standing.totalScore)
                    : "text-faint"
                }`}
              >
                {standing.completedTournaments > 0
                  ? formatScore(standing.totalScore)
                  : "—"}
              </span>
            </div>
          );
        })}

        {hasPenalty && (
          <div className="flex items-center justify-center gap-2 pt-5 text-[11.5px] text-muted">
            <span className="text-rose italic">
              –9<sup className="not-italic text-gold2">*</sup>
            </span>
            <span>= missed that major (scored the worst team&apos;s total + 5)</span>
          </div>
        )}

        <footer className="flex items-center justify-center gap-3 text-faint text-[11px] tracking-[0.3px] pt-6">
          <button
            onClick={refresh}
            className="inline-flex items-center gap-1.5 hover:text-gold2 transition-colors cursor-pointer"
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            {lastUpdated
              ? `Updated ${lastUpdated.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}`
              : "Refresh"}
          </button>
          <span aria-hidden>·</span>
          <span>Auto-refreshes every 2 minutes</span>
        </footer>
      </main>
    </div>
  );
}
