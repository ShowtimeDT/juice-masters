"use client";

import { useState } from "react";
import { formatScore } from "@/lib/format";
import Headshot from "@/components/ui/Headshot";
import ProgressRing from "@/components/ui/ProgressRing";
import { RoundHoles, HoleLegend } from "./HoleGrid";
import { effectiveScore } from "./teamScoring";
import type { TeamGolfer } from "./MyTeam";

interface TeamGolferRowProps {
  golfer: TeamGolfer;
  /** Whether this golfer's score counts toward the team's best-five total. */
  counting: boolean;
  /** Final tournament has ended — show "Final" instead of a live ring. */
  isFinal?: boolean;
}

/** Color class for a to-par total. */
function totalColor(score: number, notPlayed: boolean): string {
  if (notPlayed) return "text-faint";
  if (score < 0) return "text-sage";
  if (score > 0) return "text-rose";
  return "text-ink";
}

/** One round's to-par as a colored cell value. */
function roundCell(raw: string | undefined): { text: string; cls: string } {
  if (!raw || raw === "-") return { text: "–", cls: "text-faint" };
  if (raw === "E" || raw === "0") return { text: "E", cls: "text-faint" };
  if (raw.startsWith("-")) return { text: raw, cls: "text-sage" };
  const n = Number.parseInt(raw, 10);
  if (Number.isFinite(n) && n < 0) return { text: raw, cls: "text-sage" };
  if (raw.startsWith("+") || (Number.isFinite(n) && n > 0))
    return { text: raw.startsWith("+") ? raw : `+${n}`, cls: "text-rose" };
  return { text: raw, cls: "text-faint" };
}

/** One golfer on the live/final roster: expands into a hole-by-hole scorecard. */
export default function TeamGolferRow({ golfer, counting, isFinal = false }: TeamGolferRowProps) {
  const [open, setOpen] = useState(false);
  const { score } = golfer;
  const effective = effectiveScore(score);
  const notPlayed = score.scoreDisplay === "-";
  const hasHoles = score.rounds.some((r) => (r.holes?.length ?? 0) > 0);
  const total = notPlayed ? "–" : formatScore(effective);

  return (
    <div
      className={`border-t border-line2 first:border-t-0 relative ${
        counting ? "" : isFinal ? "opacity-50" : ""
      }`}
    >
      {/* Counting picks carry a gold left bar */}
      {counting && (
        <span className="absolute left-0 top-[14px] bottom-[14px] w-[3px] rounded-r-[2px] bg-gold" />
      )}

      <button
        onClick={() => hasHoles && setOpen(!open)}
        aria-expanded={open}
        className={`w-full grid grid-cols-[30px_minmax(0,1fr)_44px_50px_50px] sm:grid-cols-[34px_minmax(0,1fr)_44px_44px_44px_44px_58px_54px_30px] items-center gap-x-1 px-4 sm:px-[22px] h-[60px] text-left ${
          hasHoles ? "cursor-pointer hover:bg-white/[0.015]" : "cursor-default"
        }`}
      >
        {/* Tier */}
        <span className={`font-serif italic text-[15px] ${counting ? "text-gold" : "text-faint"}`}>
          T{golfer.tier}
        </span>

        {/* Headshot + name + drop/cut tag */}
        <span className="flex items-center gap-3 min-w-0">
          <Headshot name={golfer.name} espnId={score.espnId} size={34} missedCut={score.missedCut} />
          <b className="font-medium text-[15px] text-ink truncate">{golfer.name}</b>
          {!counting && (
            <span className="text-[8.5px] tracking-[1px] uppercase text-faint border border-edge rounded px-1.5 py-0.5 shrink-0">
              {score.missedCut ? "Cut" : isFinal ? "Bench" : "Drop"}
            </span>
          )}
        </span>

        {/* R1 (always) + R2–R4 (desktop only) */}
        {[0, 1, 2, 3].map((i) => {
          const cell = roundCell(score.rounds[i]?.score);
          return (
            <span
              key={i}
              className={`text-center text-[13px] tnum font-medium ${cell.cls} ${
                i === 0 ? "" : "hidden sm:block"
              }`}
            >
              {cell.text}
            </span>
          );
        })}

        {/* Thru ring (or "Final") */}
        <span className="flex justify-center">
          {isFinal ? (
            <span className="text-[12px] text-faint">Final</span>
          ) : (
            <ProgressRing thru={score.thru} size={30} />
          )}
        </span>

        {/* Total */}
        <span className={`text-right font-semibold text-[16px] tnum ${totalColor(effective, notPlayed)}`}>
          {total}
        </span>

        {/* Expand chevron (desktop column; only when hole detail exists) */}
        <span className="hidden sm:flex justify-self-end w-[26px] h-[26px] items-center justify-center text-faint">
          {hasHoles && (
            <svg
              className={`transition-transform duration-200 ${open ? "rotate-180 text-gold" : ""}`}
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
            >
              <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
        </span>
      </button>

      {/* Hole-by-hole scorecard — rounds share one horizontal scroller so they
          stay aligned and scroll together on narrow screens; legend stays fixed. */}
      {open && hasHoles && (
        <div className="border-t border-line2 mx-[14px] px-[10px] pb-[22px]">
          <div className="overflow-x-auto">
            {score.rounds.map((round) => (
              <RoundHoles key={round.round} round={round} />
            ))}
          </div>
          <HoleLegend />
        </div>
      )}
    </div>
  );
}
