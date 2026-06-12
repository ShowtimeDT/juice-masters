"use client";

import { useState } from "react";
import Image from "next/image";
import { EntryStanding, GolferScoreWithCounting } from "@/lib/types";
import {
  formatScore,
  scoreColor,
  rankSuffix,
  headshotUrl,
  golferInitials,
  golferLastName,
} from "@/lib/format";
import GolferRow from "./GolferRow";

interface EntryRowProps {
  standing: EntryStanding;
  /** Uniform team-name column width (ch) so golfers align across rows. */
  nameWidthCh?: number;
}

function HeadshotAvatar({ golfer }: { golfer: GolferScoreWithCounting }) {
  return (
    <div
      className={`relative w-10 h-10 rounded-full overflow-hidden bg-avatar border-2 transition-colors ${
        golfer.missedCut
          ? "border-red-500/40 grayscale opacity-60"
          : "border-avatar-ring hover:border-avatar-ring-hover"
      }`}
    >
      {golfer.espnId ? (
        <Image
          src={headshotUrl(golfer.espnId)}
          alt={golfer.name}
          fill
          className="object-cover object-top"
          unoptimized
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center text-gray-500 text-xs font-bold">
          {golferInitials(golfer.name)}
        </div>
      )}
    </div>
  );
}

function TopFiveStrip({ golfers }: { golfers: GolferScoreWithCounting[] }) {
  return (
    <div className="hidden sm:flex flex-1 items-center justify-center gap-5">
      {golfers.map((g) => (
        <div key={`${g.name}-${g.tier}`} className="flex flex-col items-center gap-1 w-14">
          <HeadshotAvatar golfer={g} />
          <span className="text-[10px] text-label text-center leading-tight truncate w-full">
            {golferLastName(g.name)}
          </span>
          <span className={`text-[10px] font-mono font-semibold ${scoreColor(g.effectiveScore)}`}>
            {g.scoreDisplay === "-" ? "-" : formatScore(g.effectiveScore)}
          </span>
        </div>
      ))}
    </div>
  );
}

function sortByEffectiveScore(golfers: GolferScoreWithCounting[]) {
  return [...golfers].sort((a, b) => a.effectiveScore - b.effectiveScore);
}

export default function EntryRow({ standing, nameWidthCh = 21 }: EntryRowProps) {
  const [expanded, setExpanded] = useState(false);
  const { entry, golferScores, countingScore, rank } = standing;

  const topFive = sortByEffectiveScore(golferScores.filter((g) => g.isCounting));
  const expandedOrder = [
    ...sortByEffectiveScore(golferScores.filter((g) => g.isCounting)),
    ...sortByEffectiveScore(golferScores.filter((g) => !g.isCounting)),
  ];

  return (
    <div className="bg-card rounded-lg overflow-hidden border border-edge hover:border-edge-hover transition-colors">
      {/* Summary row */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-3 sm:gap-4 px-3 sm:px-5 py-3 sm:py-4 cursor-pointer text-left"
      >
        {/* Rank */}
        <div className="w-10 sm:w-14 text-center shrink-0">
          <span className="text-2xl sm:text-[2rem] font-serif italic font-bold text-ink leading-none">
            {rank}
          </span>
          <span className="text-xs sm:text-sm font-serif italic text-ink">
            {rankSuffix(rank)}
          </span>
        </div>

        {/* Name — fixed width per leaderboard so golfers align across rows */}
        <div
          className="flex-1 sm:flex-none sm:shrink-0 min-w-[4.5rem] sm:min-w-0 sm:w-[var(--name-col)] flex items-center"
          style={{ "--name-col": `${nameWidthCh}ch` } as React.CSSProperties}
        >
          <h3 className="text-white font-semibold text-sm sm:text-base leading-tight truncate">
            {entry.name}
          </h3>
        </div>

        <TopFiveStrip golfers={topFive} />

        {/* Right section: score + info */}
        <div className="flex items-center gap-3 sm:gap-4 shrink-0">
          <div className={`text-right ${scoreColor(countingScore)}`}>
            <span className="text-2xl sm:text-[2.2rem] font-serif font-bold leading-none">
              {formatScore(countingScore)}
            </span>
          </div>

          {/* Expand icon */}
          <svg
            className={`w-4 h-4 text-faint transition-transform shrink-0 ${
              expanded ? "rotate-180" : ""
            }`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </div>
      </button>

      {/* Expanded golfer details */}
      {expanded && (
        <div className="bg-card-inset border-t border-edge overflow-x-auto">
          <div className="min-w-[28rem]">
            {/* Column headers */}
            <div className="grid grid-cols-[2rem_minmax(7rem,1fr)_3.5rem_1rem_repeat(4,3rem)_3rem] sm:grid-cols-[2.5rem_1fr_4rem_1.5rem_repeat(4,3.5rem)_3.5rem] px-3 py-1.5 text-[10px] uppercase tracking-wider text-faint font-semibold">
              <span></span>
              <span>Golfer</span>
              <span className="text-right">Score</span>
              <span></span>
              <span className="text-center">R1</span>
              <span className="text-center">R2</span>
              <span className="text-center">R3</span>
              <span className="text-center">R4</span>
              <span className="text-center">Thru</span>
            </div>

            {expandedOrder.map((golfer) => (
              <GolferRow key={`${golfer.name}-${golfer.tier}`} golfer={golfer} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
