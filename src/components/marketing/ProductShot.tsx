"use client";

import { useState } from "react";
import Headshot from "@/components/ui/Headshot";
import ProgressRing from "@/components/ui/ProgressRing";
import { DEMO_STANDINGS } from "@/lib/demo-data";
import {
  formatScore,
  scoreColor,
  rankSuffix,
  golferLastName,
} from "@/lib/format";
import type { EntryStanding, GolferScoreWithCounting } from "@/lib/types";

/**
 * Hero product shot — the live Standings board rendered inside the app window.
 * Uses the same DEMO_STANDINGS the rest of the marketing demo uses (scored by
 * the real engine) and the shared Headshot / ProgressRing primitives, so it
 * stays faithful without re-running DemoLeaderboard's own section chrome.
 */
function sortByEffectiveScore(golfers: GolferScoreWithCounting[]) {
  return [...golfers].sort((a, b) => a.effectiveScore - b.effectiveScore);
}

function PickChip({ golfer }: { golfer: GolferScoreWithCounting }) {
  return (
    <div className="flex min-w-0 flex-col items-center gap-1.5 text-center">
      <Headshot
        name={golfer.name}
        espnId={golfer.espnId}
        size={34}
        missedCut={golfer.missedCut}
      />
      <span className="max-w-full truncate text-[11px] text-muted">
        {golferLastName(golfer.name)}
      </span>
      <span
        className={`text-[12.5px] font-semibold tnum ${scoreColor(golfer.effectiveScore)}`}
      >
        {formatScore(golfer.effectiveScore)}
      </span>
    </div>
  );
}

function GolferRow({
  g,
  you,
}: {
  g: GolferScoreWithCounting;
  you: boolean;
}) {
  const r = (n: number) => g.rounds.find((x) => x.round === n)?.score ?? "–";
  const numCls = (s: string) =>
    s.startsWith("-") ? "text-under" : s.startsWith("+") ? "text-over" : "text-faint";
  return (
    <div
      className={`grid h-11 grid-cols-[28px_minmax(0,1fr)_42px_42px_42px_42px_52px_50px] items-center border-t border-line2 px-2 ${
        g.isCounting ? "" : "opacity-[0.42]"
      }`}
    >
      <span
        className={`font-serif text-[13px] italic ${g.isCounting ? "text-gold" : "text-faint"}`}
      >
        T{g.tier}
      </span>
      <span className="flex min-w-0 items-center gap-2.5">
        <Headshot name={g.name} espnId={g.espnId} size={24} missedCut={g.missedCut} />
        <b className="truncate text-[13px] font-medium text-ink">{g.name}</b>
        {!g.isCounting && (
          <span className="shrink-0 rounded border border-edge px-1.5 py-0.5 text-[8px] uppercase tracking-[0.8px] text-faint">
            Drop
          </span>
        )}
      </span>
      {[1, 2, 3, 4].map((n) => {
        const s = r(n);
        return (
          <span
            key={n}
            className={`text-center text-[12px] font-medium tnum ${numCls(s)}`}
          >
            {s}
          </span>
        );
      })}
      <span className="flex justify-center">
        <ProgressRing thru={g.thru} size={26} you={you} />
      </span>
      <span
        className={`text-right text-[14px] font-semibold tnum ${scoreColor(g.effectiveScore)}`}
      >
        {formatScore(g.effectiveScore)}
      </span>
    </div>
  );
}

function TeamCard({
  standing,
  defaultOpen,
}: {
  standing: EntryStanding;
  defaultOpen: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const { entry, golferScores, countingScore, rank } = standing;
  const isLead = rank === 1;

  const counting = sortByEffectiveScore(golferScores.filter((g) => g.isCounting));
  const order = [
    ...counting,
    ...sortByEffectiveScore(golferScores.filter((g) => !g.isCounting)),
  ];

  return (
    <div
      className={`mb-[11px] overflow-hidden rounded-[14px] border ${
        isLead
          ? "border-gold/30 bg-[linear-gradient(180deg,rgba(201,162,75,0.05),transparent),var(--surface)]"
          : "border-edge bg-card"
      }`}
    >
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex w-full cursor-pointer items-center gap-3 px-4 py-[13px] text-left sm:gap-4 sm:px-5"
      >
        <span
          className={`w-[38px] shrink-0 font-serif text-[23px] leading-none ${isLead ? "text-gold" : "text-faint"}`}
        >
          {rank}
          <sup className="ml-px align-super font-serif text-[12px] italic leading-none">
            {rankSuffix(rank)}
          </sup>
        </span>
        <div className="w-[120px] shrink-0 sm:w-[150px]">
          <b
            className={`block truncate font-serif text-[18px] font-medium leading-[1.1] ${isLead ? "text-gold2" : "text-ink"}`}
          >
            {entry.name}
          </b>
          <span className="text-[10.5px] tracking-[0.4px] text-faint">
            {entry.owner}
          </span>
        </div>
        <div className="hidden min-w-0 flex-1 grid-cols-5 items-start gap-1.5 sm:grid">
          {counting.map((g) => (
            <PickChip key={`${g.name}-${g.tier}`} golfer={g} />
          ))}
        </div>
        <div className="flex-1 sm:hidden" />
        <span
          className={`w-[54px] shrink-0 text-right font-sans text-[25px] font-semibold leading-none tracking-[-0.3px] tnum ${scoreColor(countingScore)}`}
        >
          {formatScore(countingScore)}
        </span>
        <span
          className={`flex h-6 w-6 shrink-0 items-center justify-center ${open ? "text-gold" : "text-faint"}`}
        >
          <svg
            className={`transition-transform duration-200 ${open ? "rotate-180" : ""}`}
            width="13"
            height="13"
            viewBox="0 0 24 24"
            fill="none"
          >
            <path
              d="M6 9l6 6 6-6"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>
      </button>

      {open && (
        <div className="overflow-x-auto px-2 pb-3.5 pt-0.5 sm:px-4">
          <div className="min-w-[30rem]">
            <div className="grid h-[34px] grid-cols-[28px_minmax(0,1fr)_42px_42px_42px_42px_52px_50px] items-center px-2 text-[9.5px] uppercase tracking-[1.2px] text-faint">
              <span />
              <span>Golfer</span>
              <span className="text-center">R1</span>
              <span className="text-center">R2</span>
              <span className="text-center">R3</span>
              <span className="text-center">R4</span>
              <span className="text-center">Thru</span>
              <span className="text-right">Score</span>
            </div>
            {order.map((g) => (
              <GolferRow key={`${g.name}-${g.tier}`} g={g} you={isLead} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function ProductShot() {
  return (
    <div className="px-[22px] pb-[26px] pt-[22px]">
      <div className="flex items-center justify-between px-1.5 pb-3.5">
        <span className="font-serif text-[18px] text-ink">The Sunday Game</span>
        <span className="text-[10.5px] uppercase tracking-[1.6px] text-faint">
          U.S. Open · live · best 5 of 8
        </span>
      </div>
      {DEMO_STANDINGS.slice(0, 3).map((s, i) => (
        <TeamCard key={s.entry.id} standing={s} defaultOpen={i === 0} />
      ))}
    </div>
  );
}
