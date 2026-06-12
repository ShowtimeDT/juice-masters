"use client";

import { useState } from "react";
import Image from "next/image";
import { formatScore, scoreColor, headshotUrl, golferInitials } from "@/lib/format";
import { RoundHoles, HoleLegend } from "./HoleGrid";
import type { TeamGolfer } from "./MyTeam";

/** One golfer on the My Team roster: headshot, tier, score, rounds —
    expands into a hole-by-hole scorecard. */
export default function TeamGolferRow({ golfer }: { golfer: TeamGolfer }) {
  const [expanded, setExpanded] = useState(false);
  const { score } = golfer;
  const effective = score.missedCut ? score.score + 10 : score.score;
  const hasHoles = score.rounds.some((r) => (r.holes?.length ?? 0) > 0);

  return (
    <div className="border-b border-white/5 last:border-0">
    <button
      onClick={() => hasHoles && setExpanded(!expanded)}
      className={`w-full flex items-center gap-3 sm:gap-4 px-4 py-3 text-left ${
        hasHoles ? "cursor-pointer hover:bg-white/5 transition-colors" : "cursor-default"
      }`}
    >
      {/* Tier */}
      <span className="w-7 text-gray-500 text-xs font-medium shrink-0">T{golfer.tier}</span>

      {/* Headshot */}
      <div
        className={`relative w-10 h-10 rounded-full overflow-hidden bg-avatar ring-1 shrink-0 ${
          score.missedCut ? "ring-red-500/40 grayscale opacity-60" : "ring-white/10"
        }`}
      >
        {score.espnId ? (
          <Image
            src={headshotUrl(score.espnId)}
            alt={golfer.name}
            fill
            className="object-cover object-top"
            unoptimized
          />
        ) : (
          <span className="w-full h-full flex items-center justify-center text-gray-500 text-xs font-bold">
            {golferInitials(golfer.name)}
          </span>
        )}
      </div>

      {/* Name + cut badge */}
      <div className="flex items-center gap-2 min-w-0 flex-1">
        <span className="text-gray-200 text-sm truncate">{golfer.name}</span>
        {score.missedCut && (
          <span className="text-[10px] font-bold bg-red-500/20 text-red-400 px-1.5 py-0.5 rounded shrink-0">
            CUT
          </span>
        )}
      </div>

      {/* Rounds (desktop) — hidden while expanded; the scorecard shows them */}
      {!expanded && (
        <div className="hidden sm:flex items-center gap-3 shrink-0">
          {[0, 1, 2, 3].map((i) => (
            <span key={i} className="w-8 text-center text-xs text-gray-400 font-mono tabular-nums">
              {score.rounds[i]?.score ?? "-"}
            </span>
          ))}
          <span className="w-8 text-center text-xs text-gray-500">{score.thru}</span>
        </div>
      )}

      {/* Total */}
      <span
        className={`w-12 text-right font-mono font-semibold text-sm tabular-nums shrink-0 ${scoreColor(effective)}`}
      >
        {score.scoreDisplay === "-" ? "-" : formatScore(effective)}
      </span>

      {/* Expand chevron (only when hole detail exists) */}
      {hasHoles && (
        <svg
          className={`w-3.5 h-3.5 text-faint transition-transform shrink-0 ${expanded ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      )}
    </button>

    {/* Hole-by-hole scorecard */}
    {expanded && hasHoles && (
      <div className="px-4 pb-4 bg-card-inset">
        {score.rounds.map((round) => (
          <RoundHoles key={round.round} round={round} />
        ))}
        <HoleLegend />
      </div>
    )}
    </div>
  );
}
