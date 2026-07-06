"use client";

import { useState } from "react";
import Headshot from "@/components/ui/Headshot";
import ProgressRing from "@/components/ui/ProgressRing";
import { formatScore, scoreColor } from "@/lib/format";

/** Par for each of Shinnecock's 18 holes (teaser scorecard). */
const PARS = [4, 3, 4, 4, 4, 5, 4, 3, 4, 4, 3, 5, 4, 4, 3, 4, 4, 4];

interface RosterGolfer {
  tier: number;
  name: string;
  espnId: string;
  score: number;
  thru: string;
  counting: boolean;
  open?: boolean;
  card?: number[]; // 18 hole strokes
}

const ROSTER: RosterGolfer[] = [
  { tier: 1, name: "Tommy Fleetwood", espnId: "5539", score: -2, thru: "F", counting: true, open: true, card: [3, 3, 4, 3, 4, 4, 4, 3, 4, 4, 4, 5, 4, 4, 3, 4, 4, 4] },
  { tier: 2, name: "Scottie Scheffler", espnId: "9478", score: -1, thru: "F", counting: true },
  { tier: 3, name: "Shane Lowry", espnId: "4587", score: 0, thru: "16", counting: true },
  { tier: 4, name: "Collin Morikawa", espnId: "10592", score: 1, thru: "14", counting: true },
  { tier: 5, name: "Hideki Matsuyama", espnId: "5860", score: 1, thru: "16", counting: true },
  { tier: 6, name: "Patrick Cantlay", espnId: "6007", score: 3, thru: "17", counting: false },
  { tier: 7, name: "Tyrrell Hatton", espnId: "5553", score: 4, thru: "F", counting: false },
  { tier: 8, name: "Jon Rahm", espnId: "9780", score: 4, thru: "18", counting: false },
];

/** Deterministic 18-hole round for golfers without a hard-coded card. */
function genCard(name: string): number[] {
  const seed = name.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  return PARS.map((p, i) => {
    const r = (seed * (i + 3)) % 11;
    if (r === 0) return p - 2;
    if (r < 3) return p - 1;
    if (r < 7) return p;
    if (r < 9) return p + 1;
    return p + 2;
  });
}

function holeColor(strokes: number, par: number): string {
  const d = strokes - par;
  if (d <= -2) return "text-gold2";
  if (d === -1) return "text-under";
  if (d === 0) return "text-muted font-normal";
  return "text-over";
}

function Scorecard({ card }: { card: number[] }) {
  return (
    <div className="bg-black/[0.18] px-4 pb-4">
      <div className="pb-2 pt-3 text-[9.5px] uppercase tracking-[1.6px] text-faint">
        Round 1 · Shinnecock · Par 70
      </div>
      <div className="mt-1.5 flex gap-[3px]">
        {PARS.map((_, i) => (
          <span key={i} className="min-w-0 flex-1 text-center text-[8.5px] text-faint tnum">
            {i + 1}
          </span>
        ))}
      </div>
      <div className="mt-1.5 flex gap-[3px]">
        {card.map((v, i) => (
          <span
            key={i}
            className={`min-w-0 flex-1 text-center text-[13px] font-semibold tnum ${holeColor(v, PARS[i])}`}
          >
            {v}
          </span>
        ))}
      </div>
    </div>
  );
}

function RosterRow({ g }: { g: RosterGolfer }) {
  const [open, setOpen] = useState(Boolean(g.open));
  const card = g.card ?? genCard(g.name);

  return (
    <div className="border-t border-line2">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className={`relative flex w-full cursor-pointer items-center gap-[11px] px-4 py-[9px] text-left ${
          g.counting
            ? "before:absolute before:left-0 before:top-2.5 before:bottom-2.5 before:w-[3px] before:rounded-r-sm before:bg-gold before:content-['']"
            : "opacity-50"
        }`}
      >
        <span
          className={`w-5 shrink-0 font-serif text-[13px] italic ${g.counting ? "text-gold" : "text-faint"}`}
        >
          T{g.tier}
        </span>
        <Headshot name={g.name} espnId={g.espnId} size={30} />
        <span className="min-w-0 flex-1 truncate text-[14px] font-medium text-ink">
          {g.name}
        </span>
        <ProgressRing thru={g.thru} size={28} />
        <span
          className={`w-9 text-right text-[15px] font-semibold tnum ${scoreColor(g.score)}`}
        >
          {formatScore(g.score)}
        </span>
        <span
          className={`flex h-5 w-5 shrink-0 items-center justify-center transition-transform ${open ? "rotate-180 text-gold" : "text-faint"}`}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
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
      {open && <Scorecard card={card} />}
    </div>
  );
}

export default function MyTeamFeature() {
  return (
    <div className="overflow-hidden rounded-[16px] border border-edge bg-card shadow-[0_24px_60px_rgba(0,0,0,0.4)]">
      <div className="px-1.5 pb-2.5 pt-1">
        <div className="flex items-center justify-between px-4 pb-2 pt-3">
          <span className="text-[10px] uppercase tracking-[1.6px] text-faint">
            U.S. Open Roster · live
          </span>
          <span className="inline-flex items-center gap-[7px] text-[10px] uppercase tracking-[1.6px] text-faint">
            <i className="inline-block h-[11px] w-[3px] rounded-sm bg-gold" /> Scoring · best 5 of 8
          </span>
        </div>
        <div>
          {ROSTER.map((g) => (
            <RosterRow key={g.tier} g={g} />
          ))}
        </div>
      </div>
    </div>
  );
}
