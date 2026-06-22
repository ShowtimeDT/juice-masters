"use client";

import { TOURNAMENTS, TournamentConfig, TournamentId } from "@/lib/tournaments";
import { getTournamentState } from "@/lib/tournament-state";
import Logo from "@/components/ui/Logo";

interface EventHeaderProps {
  config: TournamentConfig;
  /** Round/status detail, e.g. "Final Round" or "Draft open". */
  subStatus?: string;
  /** Show the sage "Live" pulse in the sub line. */
  isLive?: boolean;
  /**
   * Season standings is the active view. The major navigator stays on screen
   * (arrows + dots) so you can jump back to any major; the Season button glows.
   */
  seasonActive?: boolean;
  /** Page between majors (the ← venue → arrows and the progress dots). */
  onSelectMajor?: (id: TournamentId) => void;
  /** Toggle the season standings view. */
  onSeasonStandings?: () => void;
}

const MAJORS = TOURNAMENTS.filter((t) => t.id !== "season");
const ROMAN = ["I", "II", "III", "IV", "V", "VI"];

/** Drop the generic club suffix so the venue reads as a title ("Augusta National"). */
function venueTitle(venue: string): string {
  return venue.replace(/ (Golf Club|Golf Links|Country Club|Golf Course)$/i, "").trim() || venue;
}

export default function EventHeader({
  config,
  subStatus,
  isLive = false,
  seasonActive = false,
  onSelectMajor,
  onSeasonStandings,
}: EventHeaderProps) {
  const idx = MAJORS.findIndex((m) => m.id === config.id);
  // In season mode there's no current major, so the navigator sits "after" the
  // last major: the back arrow steps into The Open, the forward arrow is spent.
  const navIdx = seasonActive ? MAJORS.length : idx;
  const prev = navIdx > 0 ? MAJORS[navIdx - 1] : null;
  const next = navIdx >= 0 && navIdx < MAJORS.length - 1 ? MAJORS[navIdx + 1] : null;

  return (
    <section className="relative text-center overflow-hidden border-b border-edge px-6 pt-12 pb-11">
      {/* gold glow */}
      <div
        className="absolute left-1/2 -translate-x-1/2 pointer-events-none"
        style={{
          top: "-30%",
          width: 720,
          height: 420,
          background: "radial-gradient(ellipse, rgba(201,162,75,0.12), transparent 66%)",
        }}
      />
      {/* faint crest watermark */}
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 opacity-[0.05] pointer-events-none">
        <Logo size={240} arched={false} />
      </div>

      <div className="relative">
        <div className="eyebrow !tracking-[4px]">
          {seasonActive ? "2026 · All four majors" : idx >= 0 ? `Major ${ROMAN[idx]} of ${MAJORS.length}` : "Season"}
        </div>

        {/* major switcher */}
        <div className="flex items-center justify-center gap-4 sm:gap-6 mt-1.5">
          <button
            type="button"
            aria-label="Previous major"
            disabled={!prev}
            onClick={() => prev && onSelectMajor?.(prev.id)}
            className="w-10 h-10 sm:w-11 sm:h-11 rounded-full border border-edge flex items-center justify-center text-muted hover:text-gold hover:border-gold/50 transition-colors disabled:opacity-30 disabled:pointer-events-none shrink-0"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M15 5l-7 7 7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>

          <div className="min-w-0">
            <h1 className="font-serif font-medium text-ink leading-none text-[clamp(34px,6vw,64px)] whitespace-nowrap truncate">
              {seasonActive ? "Season Standings" : venueTitle(config.venue) || config.shortName}
            </h1>
          </div>

          <button
            type="button"
            aria-label="Next major"
            disabled={!next}
            onClick={() => next && onSelectMajor?.(next.id)}
            className="w-10 h-10 sm:w-11 sm:h-11 rounded-full border border-edge flex items-center justify-center text-muted hover:text-gold hover:border-gold/50 transition-colors disabled:opacity-30 disabled:pointer-events-none shrink-0"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M9 5l7 7-7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>

        {/* sub line */}
        <div className="mt-3 text-[13.5px] tracking-[0.4px] text-muted">
          {seasonActive ? (
            "Every score across all four majors"
          ) : (
            <>
              {isLive && (
                <span className="inline-flex items-center gap-1.5 text-sage mr-2.5">
                  <i className="w-[7px] h-[7px] rounded-full bg-sage shadow-[0_0_0_3px_rgba(156,203,134,0.2)]" />
                  Live
                </span>
              )}
              {config.shortName}
              {subStatus ? ` · ${subStatus}` : ""}
            </>
          )}
        </div>

        {/* progress dots + season standings toggle */}
        <div className="flex items-center justify-center flex-wrap gap-x-4 gap-y-3 mt-5">
          <div className="flex items-center gap-2.5">
            {MAJORS.map((m) => {
              const isOn = !seasonActive && m.id === config.id;
              const done = !isOn && getTournamentState(m) === "completed";
              return (
                <button
                  key={m.id}
                  type="button"
                  aria-label={m.shortName}
                  onClick={() => onSelectMajor?.(m.id)}
                  className={`rounded-full transition-all ${
                    isOn
                      ? "w-2 h-2 bg-gold shadow-[0_0_0_3px_rgba(201,162,75,0.18)]"
                      : done
                        ? "w-[7px] h-[7px] bg-muted hover:bg-gold"
                        : "w-[7px] h-[7px] bg-edge hover:bg-gold"
                  }`}
                />
              );
            })}
          </div>

          {onSeasonStandings && (
            <>
              <span className="hidden sm:block w-px h-5 bg-edge" />
              <button
                type="button"
                onClick={onSeasonStandings}
                className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-[12.5px] font-medium tracking-[0.4px] border transition-colors ${
                  seasonActive
                    ? "border-gold bg-goldsoft text-gold2 shadow-[0_0_18px_rgba(201,162,75,0.28)]"
                    : "border-edge text-muted hover:border-gold/50 hover:text-gold2"
                }`}
              >
                Season Standings
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                  <path d="M9 6l6 6-6 6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </>
          )}
        </div>
      </div>
    </section>
  );
}
