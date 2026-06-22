import { HoleScore, RoundScore } from "@/lib/types";

/**
 * Golf-notation hole cell, matching the design scorecard:
 *  - eagle+ : gold ring + soft gold halo, gold text
 *  - birdie : sage ring, sage text
 *  - par    : bare muted number
 *  - bogey  : rose rounded-square ring, rose text
 *  - double+: filled rose square, dark text
 *  - blank  : faint dash for an unplayed hole
 */
function shapeClass(toPar: number): string {
  if (toPar <= -2)
    return "border-[1.5px] border-gold rounded-full shadow-[0_0_0_2px_rgba(201,162,75,0.22)] text-gold2";
  if (toPar === -1) return "border-[1.5px] border-sage rounded-full text-sage";
  if (toPar === 0) return "text-muted";
  if (toPar === 1) return "border-[1.5px] border-rose rounded-[7px] text-rose";
  return "bg-rose rounded-[7px] text-[#1A1408] font-semibold";
}

function HoleCell({ hole }: { hole: HoleScore }) {
  return (
    <div className="flex items-center justify-center h-9">
      <i
        className={`w-[27px] h-[27px] flex items-center justify-center not-italic text-[13px] font-medium tnum text-ink ${shapeClass(
          hole.toPar
        )}`}
      >
        {hole.strokes}
      </i>
    </div>
  );
}

const ROW_GRID =
  "grid grid-cols-[repeat(9,1fr)_50px] sm:grid-cols-[repeat(18,1fr)_56px] items-center";

function totalColor(score: number): string {
  if (score < 0) return "text-sage";
  if (score > 0) return "text-rose";
  return "text-ink";
}

/** One round: holes 1–18 with a hole-number header row, round total at the end. */
export function RoundHoles({ round }: { round: RoundScore }) {
  const holes = round.holes ?? [];
  if (holes.length === 0) return null;
  const totalToPar = round.score === "E" ? 0 : parseInt(round.score, 10) || 0;

  return (
    <div>
      <div className="text-[10.5px] tracking-[2px] uppercase text-faint pt-3.5 pb-2.5">
        Round {round.round}
      </div>
      {/* Hole numbers (1–18, hidden 10–18 on narrow) + "Tot" */}
      <div className={`${ROW_GRID}`}>
        {holes.map((h, i) => (
          <span
            key={h.hole}
            className={`text-center text-[10px] text-faint tnum ${i >= 9 ? "hidden sm:block" : ""}`}
          >
            {h.hole}
          </span>
        ))}
        <span className="text-center text-[9px] font-semibold tracking-[1px] uppercase text-muted">
          Tot
        </span>
      </div>
      {/* Hole strokes + round total */}
      <div className={`${ROW_GRID} mt-1`}>
        {holes.map((h, i) => (
          <div key={h.hole} className={i >= 9 ? "hidden sm:flex" : "flex"}>
            <HoleCell hole={h} />
          </div>
        ))}
        <span className={`text-center font-semibold text-[15px] tnum ${totalColor(totalToPar)}`}>
          {round.score}
        </span>
      </div>
    </div>
  );
}

export function HoleLegend() {
  return (
    <div className="flex flex-wrap gap-x-[22px] gap-y-2 mt-4">
      <span className="flex items-center gap-2 text-[11px] tracking-[0.5px] text-muted">
        <i className="w-[15px] h-[15px] border-[1.5px] border-gold rounded-full shadow-[0_0_0_1.5px_rgba(201,162,75,0.22)]" />
        Eagle+
      </span>
      <span className="flex items-center gap-2 text-[11px] tracking-[0.5px] text-muted">
        <i className="w-[15px] h-[15px] border-[1.5px] border-sage rounded-full" />
        Birdie
      </span>
      <span className="flex items-center gap-2 text-[11px] tracking-[0.5px] text-muted">
        <i className="w-[15px] h-[15px] border-[1.5px] border-rose rounded" />
        Bogey
      </span>
      <span className="flex items-center gap-2 text-[11px] tracking-[0.5px] text-muted">
        <i className="w-[15px] h-[15px] bg-rose rounded" />
        Double+
      </span>
    </div>
  );
}
