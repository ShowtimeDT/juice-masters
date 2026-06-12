import { HoleScore, RoundScore } from "@/lib/types";
import { scoreColor } from "@/lib/format";

/**
 * Golf-notation hole cell: circles for under par (double ring = eagle+),
 * squares for over par (double ring = double bogey+), bare number for par.
 */
function holeStyle(toPar: number): string {
  if (toPar <= -2) return "rounded-full ring-2 ring-brand text-brand";
  if (toPar === -1) return "rounded-full ring-1 ring-under text-under";
  if (toPar === 0) return "text-gray-300";
  if (toPar === 1) return "rounded-sm ring-1 ring-over/70 text-over";
  return "rounded-sm ring-2 ring-over text-over";
}

function HoleCell({ hole }: { hole: HoleScore }) {
  return (
    <div className="flex flex-col items-center gap-1 shrink-0">
      <span className="text-[9px] text-faint">{hole.hole}</span>
      <span
        className={`w-6 h-6 flex items-center justify-center text-[11px] font-mono tabular-nums ${holeStyle(hole.toPar)}`}
      >
        {hole.strokes}
      </span>
    </div>
  );
}

/** One round: holes 1–18 on a single line, round total at the end. */
export function RoundHoles({ round }: { round: RoundScore }) {
  const holes = round.holes ?? [];
  if (holes.length === 0) return null;
  const totalToPar = round.score === "E" ? 0 : parseInt(round.score, 10) || 0;

  return (
    <div className="py-3 border-b border-white/5 last:border-0">
      <span className="block text-[10px] uppercase tracking-wider text-faint font-semibold mb-2">
        Round {round.round}
      </span>
      <div className="flex items-end gap-1 sm:gap-1.5 overflow-x-auto px-1 pb-1">
        {holes.map((h) => (
          <HoleCell key={h.hole} hole={h} />
        ))}
        {/* Round total after hole 18 */}
        <div className="flex flex-col items-center gap-1 shrink-0 pl-2 sm:pl-3 ml-1 border-l border-white/10">
          <span className="text-[9px] text-faint uppercase">Tot</span>
          <span
            className={`h-6 flex items-center text-[12px] font-mono font-bold tabular-nums ${scoreColor(totalToPar)}`}
          >
            {round.score}
          </span>
        </div>
      </div>
    </div>
  );
}

export function HoleLegend() {
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 pt-3 text-[10px] text-faint">
      <span className="flex items-center gap-1.5">
        <span className="w-3.5 h-3.5 rounded-full ring-2 ring-brand inline-block" /> Eagle+
      </span>
      <span className="flex items-center gap-1.5">
        <span className="w-3.5 h-3.5 rounded-full ring-1 ring-under inline-block" /> Birdie
      </span>
      <span className="flex items-center gap-1.5">
        <span className="w-3.5 h-3.5 rounded-sm ring-1 ring-over/70 inline-block" /> Bogey
      </span>
      <span className="flex items-center gap-1.5">
        <span className="w-3.5 h-3.5 rounded-sm ring-2 ring-over inline-block" /> Double+
      </span>
    </div>
  );
}
