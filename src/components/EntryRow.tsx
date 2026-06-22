"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { EntryStanding, GolferScoreWithCounting } from "@/lib/types";
import { formatScore, scoreColor, rankSuffix, golferLastName } from "@/lib/format";
import Headshot from "@/components/ui/Headshot";
import GolferRow from "./GolferRow";

interface EntryRowProps {
  standing: EntryStanding;
}

function sortByEffectiveScore(golfers: GolferScoreWithCounting[]) {
  return [...golfers].sort((a, b) => a.effectiveScore - b.effectiveScore);
}

/** One counting-golfer chip in the inline five-up strip. */
function PickChip({ golfer }: { golfer: GolferScoreWithCounting }) {
  const notPlayed = golfer.scoreDisplay === "-";
  return (
    <div className="flex flex-col items-center gap-1.5 text-center min-w-0">
      <Headshot name={golfer.name} espnId={golfer.espnId} size={40} missedCut={golfer.missedCut} />
      <span className="text-[11.5px] text-muted truncate max-w-full">
        {golferLastName(golfer.name)}
      </span>
      <span className={`text-[13px] font-semibold tnum ${scoreColor(golfer.effectiveScore)}`}>
        {notPlayed ? "–" : formatScore(golfer.effectiveScore)}
      </span>
    </div>
  );
}

export default function EntryRow({ standing }: EntryRowProps) {
  const [open, setOpen] = useState(false);
  const { data: session } = useSession();
  const { entry, golferScores, countingScore, rank } = standing;

  const isYou = Boolean(session?.user?.name) && entry.owner === session?.user?.name;
  const isLead = rank === 1;

  const counting = sortByEffectiveScore(golferScores.filter((g) => g.isCounting));
  const expandedOrder = [
    ...counting,
    ...sortByEffectiveScore(golferScores.filter((g) => !g.isCounting)),
  ];

  return (
    <div
      className={`rounded-2xl border overflow-hidden transition-colors ${
        isYou
          ? "border-gold/30 bg-[linear-gradient(180deg,rgba(201,162,75,0.05),transparent),var(--surface)]"
          : "border-edge bg-card hover:border-edge-hover"
      }`}
    >
      <div className="flex items-center gap-3 sm:gap-[18px] px-4 sm:px-[22px] py-[15px]">
        {/* Rank */}
        <span
          className={`font-serif text-[25px] leading-none w-10 shrink-0 ${
            isLead ? "text-gold" : "text-faint"
          }`}
        >
          {rank}
          <sup className="font-serif italic text-[13px] font-medium ml-px">{rankSuffix(rank)}</sup>
        </span>

        {/* Team name + owner */}
        <div className="w-[110px] sm:w-[168px] shrink-0 min-w-0">
          <b
            className={`block font-serif font-medium text-[18px] sm:text-[20px] leading-[1.12] truncate ${
              isYou ? "text-gold2" : "text-ink"
            }`}
          >
            {entry.name}
          </b>
          {entry.owner !== entry.name && (
            <span className="block text-[11px] tracking-[0.4px] text-faint truncate">
              {entry.owner}
            </span>
          )}
        </div>

        {/* Counting five (desktop) */}
        <div className="hidden sm:grid flex-1 grid-cols-5 gap-2 items-start min-w-0">
          {counting.map((g) => (
            <PickChip key={`${g.name}-${g.tier}`} golfer={g} />
          ))}
        </div>

        <div className="flex-1 sm:hidden" />

        {/* Team total */}
        <span
          className={`w-[52px] sm:w-[58px] text-right font-sans font-semibold text-[22px] sm:text-[26px] leading-none tracking-[-0.3px] tnum shrink-0 ${scoreColor(
            countingScore
          )}`}
        >
          {formatScore(countingScore)}
        </span>

        {/* Expand */}
        <button
          onClick={() => setOpen(!open)}
          aria-label="Show round breakdown"
          aria-expanded={open}
          className="w-[30px] h-[30px] shrink-0 rounded-full border border-edge flex items-center justify-center text-faint hover:text-gold hover:border-gold/50 transition-colors cursor-pointer"
        >
          <svg
            className={`transition-transform duration-200 ${open ? "rotate-180" : ""}`}
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
          >
            <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>

      {/* Expanded breakdown */}
      {open && (
        <div className="mx-3 sm:mx-[14px] pb-3 border-t border-line2 overflow-x-auto">
          <div className="min-w-[30rem]">
            <div className="grid grid-cols-[28px_minmax(0,1fr)_38px_38px_38px_38px_50px_52px] sm:grid-cols-[32px_minmax(0,1fr)_44px_44px_44px_44px_58px_58px] gap-x-1 h-[38px] items-center px-2 sm:px-3 text-[10px] tracking-[1.4px] uppercase text-faint">
              <span />
              <span>Golfer</span>
              <span className="text-center">R1</span>
              <span className="text-center">R2</span>
              <span className="text-center">R3</span>
              <span className="text-center">R4</span>
              <span className="text-center">Thru</span>
              <span className="text-right">Score</span>
            </div>
            {expandedOrder.map((g) => (
              <GolferRow key={`${g.name}-${g.tier}`} golfer={g} you={isYou} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
