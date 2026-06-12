import { HoleScore, RoundScore } from "@/lib/types";

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
    <div className="flex flex-col items-center gap-1">
      <span className="text-[9px] text-faint">{hole.hole}</span>
      <span
        className={`w-6 h-6 flex items-center justify-center text-[11px] font-mono tabular-nums ${holeStyle(hole.toPar)}`}
      >
        {hole.strokes}
      </span>
    </div>
  );
}

function NineHoles({ holes }: { holes: HoleScore[] }) {
  return (
    <div className="flex gap-1 sm:gap-1.5">
      {holes.map((h) => (
        <HoleCell key={h.hole} hole={h} />
      ))}
    </div>
  );
}

/** One round's 18 holes, split front nine / back nine. */
export function RoundHoles({ round }: { round: RoundScore }) {
  const holes = round.holes ?? [];
  if (holes.length === 0) return null;
  const front = holes.filter((h) => h.hole <= 9);
  const back = holes.filter((h) => h.hole > 9);

  return (
    <div className="py-3 border-b border-white/5 last:border-0">
      <div className="flex items-baseline gap-2 mb-2">
        <span className="text-[10px] uppercase tracking-wider text-faint font-semibold">
          Round {round.round}
        </span>
        <span className="text-xs font-mono text-gray-400">{round.score}</span>
      </div>
      <div className="flex flex-col gap-2 overflow-x-auto">
        <NineHoles holes={front} />
        {back.length > 0 && <NineHoles holes={back} />}
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
