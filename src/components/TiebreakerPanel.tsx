"use client";

import { useSession } from "next-auth/react";
import { EntryStanding } from "@/lib/types";
import BirdieBar from "@/components/ui/BirdieBar";

interface TiebreakerPanelProps {
  standings: EntryStanding[];
  actualBirdies: number;
}

const ROW =
  "grid grid-cols-[24px_minmax(0,1fr)_64px_72px] sm:grid-cols-[30px_minmax(0,1fr)_80px_200px_72px] items-center gap-3 sm:gap-4 px-5 sm:px-[26px]";

/** Birdie tiebreaker — everyone guesses the field's total birdies; closest wins ties. */
export default function TiebreakerPanel({ standings, actualBirdies }: TiebreakerPanelProps) {
  const { data: session } = useSession();

  const rows = [...standings]
    .map((s) => ({
      name: s.entry.name,
      owner: s.entry.owner,
      guess: s.entry.tiebreakerGuess,
      diff: s.entry.tiebreakerGuess - actualBirdies,
    }))
    .sort((a, b) => Math.abs(a.diff) - Math.abs(b.diff));

  const n = rows.length;

  return (
    <section className="bg-card border border-edge rounded-2xl overflow-hidden">
      {/* Head */}
      <div className="flex justify-between items-start gap-6 px-6 sm:px-[26px] pt-6 pb-5 border-b border-edge">
        <div>
          <div className="text-[11px] tracking-[3px] uppercase text-gold font-medium">Tiebreaker</div>
          <h3 className="font-serif font-medium text-[26px] sm:text-[30px] text-ink mt-1">
            Total Birdies
          </h3>
          <p className="text-[13px] text-muted mt-2 max-w-[46ch] leading-[1.55]">
            Everyone guesses the field&apos;s birdie total for the week. The closest guess wins any
            tie — the gap shrinks as the birdies roll in.
          </p>
        </div>
        <div className="text-right shrink-0">
          <div className="inline-flex items-center gap-1.5 text-[10px] tracking-[1.8px] uppercase text-faint">
            <span className="w-1.5 h-1.5 rounded-full bg-sage shadow-[0_0_0_3px_rgba(156,203,134,0.2)]" />
            Actual · live
          </div>
          <div className="font-serif font-medium text-[40px] sm:text-[48px] text-gold leading-none mt-1 tnum">
            {actualBirdies}
          </div>
        </div>
      </div>

      {/* Column headers */}
      <div className={`${ROW} h-10 text-[10px] tracking-[1.4px] uppercase text-faint`}>
        <span />
        <span>Player</span>
        <span className="text-right">Guess</span>
        <span className="hidden sm:block" />
        <span className="text-right">Off by</span>
      </div>

      {/* Rows */}
      {rows.map((b, i) => {
        const t = n > 1 ? i / (n - 1) : 0;
        const color = `color-mix(in oklab, var(--gold2), var(--rose) ${Math.round(t * 100)}%)`;
        const isWin = i === 0;
        const isYou = Boolean(session?.user?.name) && b.owner === session?.user?.name;
        const offBy = b.diff === 0 ? "exact" : `${b.diff > 0 ? "+" : ""}${b.diff}`;

        return (
          <div
            key={`${b.name}-${i}`}
            className={`${ROW} h-[50px] border-t border-line2 ${
              isWin ? "bg-[linear-gradient(90deg,rgba(201,162,75,0.09),transparent_70%)]" : ""
            }`}
          >
            <span className={`font-serif italic text-[15px] ${isWin ? "text-gold" : "text-faint"}`}>
              {i + 1}
            </span>
            <span className="flex items-center gap-2.5 min-w-0">
              <span
                className={`font-medium text-[15px] truncate ${isYou ? "text-gold2" : "text-ink"}`}
              >
                {b.name}
              </span>
              {isWin ? (
                <span className="btn-gold text-[8.5px] tracking-[1px] uppercase font-bold rounded px-1.5 py-[3px] shrink-0">
                  Closest
                </span>
              ) : isYou ? (
                <span className="text-[8.5px] tracking-[1px] uppercase text-gold2 border border-gold/50 rounded px-1.5 py-0.5 shrink-0">
                  You
                </span>
              ) : null}
            </span>
            <span className="text-right font-semibold text-base tnum text-ink">
              {b.guess.toLocaleString()}
            </span>
            <span className="hidden sm:block">
              <BirdieBar birdiesSoFar={actualBirdies} guess={b.guess} color={color} />
            </span>
            <span
              className={`text-right text-sm tnum ${isWin ? "text-gold2 font-semibold" : "text-muted"}`}
            >
              {offBy}
            </span>
          </div>
        );
      })}

      <div className="text-center text-[11px] tracking-[1.5px] uppercase text-faint py-4 border-t border-line2">
        Auto-refreshes every 2 minutes
      </div>
    </section>
  );
}
