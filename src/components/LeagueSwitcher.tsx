"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { useOutsideClick } from "@/lib/useOutsideClick";

export interface LeagueOption {
  id: string;
  name: string;
  slug: string;
  /**
   * Optional member count + the viewer's rank, shown as "8 members · you're 3rd".
   * TODO(backend): /api/leagues/my doesn't return these yet — omitted until a
   * backend field exists. Render gracefully when absent.
   */
  members?: number;
  rank?: number;
}

interface LeagueSwitcherProps {
  currentName: string;
  currentSlug: string;
  leagues: LeagueOption[];
  /** Link to the manage page, or null when the viewer isn't the commissioner. */
  manageHref: string | null;
}

const ORDINALS = ["th", "st", "nd", "rd"];
function ordinal(n: number): string {
  const v = n % 100;
  return n + (ORDINALS[(v - 20) % 10] ?? ORDINALS[v] ?? ORDINALS[0]);
}

function leagueMeta(league: LeagueOption): string | null {
  const parts: string[] = [];
  if (typeof league.members === "number") parts.push(`${league.members} members`);
  if (typeof league.rank === "number") parts.push(`you're ${ordinal(league.rank)}`);
  return parts.length ? parts.join(" · ") : null;
}

/** League switcher: a gold pill that opens a 292px panel to switch, manage, or join/create. */
export default function LeagueSwitcher({
  currentName,
  currentSlug,
  leagues,
  manageHref,
}: LeagueSwitcherProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  useOutsideClick(containerRef, () => setOpen(false), open);

  return (
    <div className="relative shrink-0" ref={containerRef}>
      <button
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        className="flex items-center gap-2 rounded-full border border-gold/40 bg-goldsoft px-3.5 py-2 text-[12.5px] tracking-[0.4px] text-gold2 whitespace-nowrap cursor-pointer hover:border-gold/70 transition-colors"
      >
        <span className="truncate max-w-[8rem] sm:max-w-[14rem]">{currentName}</span>
        <svg
          className={`w-3.5 h-3.5 shrink-0 opacity-70 transition-transform ${open ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 9l6 6 6-6" />
        </svg>
      </button>

      {open && (
        <div className="absolute top-[calc(100%+10px)] right-0 w-[292px] bg-card border border-edge rounded-2xl shadow-[0_24px_60px_rgba(0,0,0,0.5)] overflow-hidden z-[60]">
          <div className="px-4 pt-3.5 pb-2 text-[9.5px] tracking-[1.8px] uppercase text-faint">
            Your leagues
          </div>

          {leagues.map((league, i) => {
            const isActive = league.slug === currentSlug;
            const meta = leagueMeta(league);
            return (
              <a
                key={league.id}
                href={`/league/${league.slug}`}
                onClick={() => setOpen(false)}
                className={`flex items-center gap-2.5 px-4 py-2.5 cursor-pointer transition-colors ${
                  i === 0 ? "" : "border-t border-line2"
                } ${isActive ? "bg-goldsoft" : "hover:bg-white/[0.025]"}`}
              >
                <span className="flex-1 min-w-0">
                  <b
                    className={`block text-sm font-medium leading-tight truncate ${
                      isActive ? "text-gold2" : "text-ink"
                    }`}
                  >
                    {league.name}
                  </b>
                  {meta && <em className="not-italic text-[11.5px] text-faint">{meta}</em>}
                </span>
                {isActive && (
                  <svg
                    className="text-gold2 shrink-0"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                  >
                    <path
                      d="M5 12l5 5L19 7"
                      stroke="currentColor"
                      strokeWidth="2.4"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                )}
              </a>
            );
          })}

          <div className="h-px bg-edge my-1.5" />

          {manageHref && (
            <a
              href={manageHref}
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 px-4 py-3 text-[13px] text-text hover:bg-white/[0.03] hover:text-ink transition-colors"
            >
              <svg
                className="text-muted shrink-0"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
              >
                <circle cx="12" cy="12" r="3.2" stroke="currentColor" strokeWidth="1.8" />
                <path
                  d="M12 2.5v3M12 18.5v3M21.5 12h-3M5.5 12h-3M18.4 5.6l-2.1 2.1M7.7 16.3l-2.1 2.1M18.4 18.4l-2.1-2.1M7.7 7.7 5.6 5.6"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                />
              </svg>
              Manage this league
            </a>
          )}

          <Link
            href="/?home=1"
            onClick={() => setOpen(false)}
            className="flex items-center gap-3 px-4 py-3 text-[13px] text-gold2 hover:bg-white/[0.03] transition-colors"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
            Join or create a league
          </Link>
        </div>
      )}
    </div>
  );
}
