"use client";

import { useState } from "react";
import { GolferScoreWithCounting } from "@/lib/types";
import { formatScore } from "@/lib/format";
import Headshot from "@/components/ui/Headshot";
import ProgressRing from "@/components/ui/ProgressRing";
import { RoundHoles, HoleLegend } from "@/components/team/HoleGrid";

interface GolferRowProps {
  golfer: GolferScoreWithCounting;
  /** Lighter inner ring disc when this is the viewer's own card. */
  you?: boolean;
}

const GRID =
  "grid grid-cols-[28px_minmax(0,1fr)_38px_38px_38px_38px_50px_52px] sm:grid-cols-[32px_minmax(0,1fr)_44px_44px_44px_44px_58px_58px] items-center gap-x-1 px-2 sm:px-3";

/** Color class for a single round value relative to par ("-3", "+2", "E", "-"). */
function roundCell(raw: string | undefined): { text: string; cls: string } {
  if (!raw || raw === "-") return { text: "–", cls: "text-faint" };
  if (raw === "E" || raw === "0") return { text: "E", cls: "text-faint" };
  if (raw.startsWith("-")) return { text: raw, cls: "text-sage" };
  if (raw.startsWith("+")) return { text: raw, cls: "text-rose" };
  const n = Number.parseInt(raw, 10);
  if (Number.isFinite(n)) {
    if (n < 0) return { text: raw, cls: "text-sage" };
    if (n > 0) return { text: `+${n}`, cls: "text-rose" };
  }
  return { text: raw, cls: "text-faint" };
}

function totalColor(score: number): string {
  if (score < 0) return "text-sage";
  if (score > 0) return "text-rose";
  return "text-ink";
}

/**
 * One golfer in a team's breakdown. Expands into the same hole-by-hole scorecard
 * used on My Team — a nested dropdown (team card → golfers → scorecard).
 */
export default function GolferRow({ golfer, you = false }: GolferRowProps) {
  const [open, setOpen] = useState(false);
  const counting = golfer.isCounting;
  const notPlayed = golfer.scoreDisplay === "-";
  const total = notPlayed ? "–" : formatScore(golfer.effectiveScore);
  const hasHoles = golfer.rounds.some((r) => (r.holes?.length ?? 0) > 0);

  return (
    <div className={`border-t border-line2 ${counting ? "" : "opacity-[0.42]"}`}>
      <button
        onClick={() => hasHoles && setOpen(!open)}
        aria-expanded={open}
        className={`${GRID} h-12 w-full text-left ${
          hasHoles ? "cursor-pointer hover:bg-white/[0.015]" : "cursor-default"
        }`}
      >
        {/* Tier */}
        <span className={`font-serif italic text-sm ${counting ? "text-gold" : "text-faint"}`}>
          T{golfer.tier}
        </span>

        {/* Golfer name (+ headshot, + Drop tag, + expand chevron) */}
        <span className="flex items-center gap-2.5 min-w-0">
          <Headshot name={golfer.name} espnId={golfer.espnId} size={26} missedCut={golfer.missedCut} />
          <b className="font-medium text-sm text-ink truncate">{golfer.name}</b>
          {!counting && (
            <span className="text-[8.5px] tracking-[1px] uppercase text-faint border border-edge rounded px-1.5 py-0.5 shrink-0">
              {golfer.missedCut ? "Cut" : "Drop"}
            </span>
          )}
          {hasHoles && (
            <svg
              className={`shrink-0 text-faint transition-transform duration-200 ${
                open ? "rotate-180 text-gold" : ""
              }`}
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
            >
              <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
        </span>

        {/* R1–R4 */}
        {[0, 1, 2, 3].map((i) => {
          const cell = roundCell(golfer.rounds[i]?.score);
          return (
            <span key={i} className={`text-center text-[13px] tnum font-medium ${cell.cls}`}>
              {cell.text}
            </span>
          );
        })}

        {/* Thru */}
        <span className="flex justify-center">
          <ProgressRing thru={golfer.thru} size={30} you={you} />
        </span>

        {/* Total */}
        <span className={`text-right font-semibold text-base tnum ${totalColor(golfer.effectiveScore)}`}>
          {total}
        </span>
      </button>

      {/* Nested hole-by-hole scorecard */}
      {open && hasHoles && (
        <div className="px-2 sm:px-3 pb-3">
          <div className="overflow-x-auto">
            {golfer.rounds.map((round) => (
              <RoundHoles key={round.round} round={round} />
            ))}
          </div>
          <HoleLegend />
        </div>
      )}
    </div>
  );
}
