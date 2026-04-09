"use client";

import { useState } from "react";
import Image from "next/image";
import { EntryStanding } from "@/lib/types";
import GolferRow from "./GolferRow";

function headshotUrl(espnId: string): string {
  return `https://a.espncdn.com/combiner/i?img=/i/headshots/golf/players/full/${espnId}.png&w=96&h=70&cb=1`;
}

interface EntryRowProps {
  standing: EntryStanding;
}

function formatScore(score: number): string {
  if (score === 0) return "E";
  if (score > 0) return `+${score}`;
  return score.toString();
}

function scoreColor(score: number): string {
  if (score < 0) return "text-[#4ade80]";
  if (score > 0) return "text-[#f87171]";
  return "text-gray-300";
}

function rankNumber(rank: number): string {
  return rank.toString();
}

function rankSuffix(rank: number): string {
  if (rank === 1) return "st";
  if (rank === 2) return "nd";
  if (rank === 3) return "rd";
  return "th";
}

export default function EntryRow({ standing }: EntryRowProps) {
  const [expanded, setExpanded] = useState(false);
  const { entry, golferScores, countingScore, rank } = standing;

  const topFive = [...golferScores]
    .sort((a, b) => a.effectiveScore - b.effectiveScore)
    .slice(0, 5);

  return (
    <div className="bg-[#1e2124] rounded-lg overflow-hidden border border-[#3a3e3a] hover:border-[#4a4e4a] transition-colors">
      {/* Summary row */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-3 sm:gap-4 px-3 sm:px-5 py-3 sm:py-4 cursor-pointer text-left"
      >
        {/* Rank */}
        <div className="w-10 sm:w-14 text-center shrink-0">
          <span className="text-2xl sm:text-[2rem] font-serif italic font-bold text-[#d4d4d4] leading-none">
            {rankNumber(rank)}
          </span>
          <span className="text-xs sm:text-sm font-serif italic text-[#d4d4d4]">
            {rankSuffix(rank)}
          </span>
        </div>

        {/* Name */}
        <div className="flex-1 sm:flex-none sm:shrink-0 min-w-[4.5rem] sm:min-w-[5.5rem] flex items-center">
          <h3 className="text-white font-semibold text-sm sm:text-base leading-tight truncate">
            {entry.name}
          </h3>
        </div>

        {/* Top 5 headshots - desktop only */}
        <div className="hidden sm:flex flex-1 items-center justify-center gap-5">
          {topFive.map((g) => (
            <div key={`${g.name}-${g.tier}`} className="flex flex-col items-center gap-1 w-14">
              <div
                className={`relative w-10 h-10 rounded-full overflow-hidden bg-[#2a2e2a] border-2 transition-colors ${
                  g.missedCut
                    ? "border-red-500/40 grayscale opacity-60"
                    : "border-[#3a5a3a] hover:border-[#4a7a4a]"
                }`}
              >
                {g.espnId ? (
                  <Image
                    src={headshotUrl(g.espnId)}
                    alt={g.name}
                    fill
                    className="object-cover object-top"
                    unoptimized
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-500 text-xs font-bold">
                    {g.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")}
                  </div>
                )}
              </div>
              <span className="text-[10px] text-[#7a7e7a] text-center leading-tight truncate w-full">
                {g.name.split(" ").pop()}
              </span>
              <span
                className={`text-[10px] font-mono font-semibold ${
                  g.effectiveScore < 0
                    ? "text-[#4ade80]"
                    : g.effectiveScore > 0
                    ? "text-[#f87171]"
                    : "text-[#9a9e9a]"
                }`}
              >
                {g.scoreDisplay === "-" ? "-" : g.scoreDisplay}
              </span>
            </div>
          ))}
        </div>

        {/* Right section: score + info */}
        <div className="flex items-center gap-3 sm:gap-4 shrink-0">
          {/* Total score */}
          <div className={`text-right ${scoreColor(countingScore)}`}>
            <span className="text-2xl sm:text-[2.2rem] font-serif font-bold leading-none">
              {formatScore(countingScore)}
            </span>
          </div>

          {/* Info text - desktop only */}
          <div className="hidden sm:flex flex-col items-end gap-0.5 min-w-[9rem]">
            <span className="text-[#6b7070] text-[10px] uppercase tracking-wider font-semibold">
              Best 5 Scores Counting
            </span>
          </div>

          {/* Expand icon */}
          <svg
            className={`w-4 h-4 text-[#5a5e5a] transition-transform shrink-0 ${
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
        <div className="bg-[#181a1c] border-t border-[#3a3e3a] overflow-x-auto">
          <div className="min-w-[28rem]">
            {/* Column headers */}
            <div className="grid grid-cols-[2rem_minmax(7rem,1fr)_3.5rem_repeat(4,3rem)_3rem] sm:grid-cols-[2.5rem_1fr_4rem_repeat(4,3.5rem)_3.5rem] px-3 py-1.5 text-[10px] uppercase tracking-wider text-[#5a5e5a] font-semibold">
              <span></span>
              <span>Golfer</span>
              <span className="text-right">Score</span>
              <span className="text-center">R1</span>
              <span className="text-center">R2</span>
              <span className="text-center">R3</span>
              <span className="text-center">R4</span>
              <span className="text-center">Thru</span>
            </div>

            {/* Golfer rows - sorted: counting first, then non-counting */}
            {[...golferScores]
              .sort((a, b) => {
                if (a.isCounting && !b.isCounting) return -1;
                if (!a.isCounting && b.isCounting) return 1;
                return a.effectiveScore - b.effectiveScore;
              })
              .map((golfer) => (
                <GolferRow key={`${golfer.name}-${golfer.tier}`} golfer={golfer} />
              ))}
          </div>
        </div>
      )}
    </div>
  );
}
