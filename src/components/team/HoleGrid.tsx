import type { CSSProperties } from "react";
import { HoleScore, RoundScore } from "@/lib/types";

/*
 * Hole-by-hole scorecard. Every round renders on ONE shared, full-width grid:
 * 19 equal columns (18 holes + TOT) divide the card's full width, so the holes
 * spread edge-to-edge like a real scorecard. The hole-number header row and each
 * round's score row use the identical template so they stay aligned. A minWidth
 * keeps the markers usable on very narrow screens (the card scrolls rather than
 * crushing the columns); on a normal card the 1fr columns fill 100%.
 */
const MARKER = 27; // fixed square marker diameter (design: 27px)

const GRID_COLS: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(19, 1fr)",
  alignItems: "center",
  width: "100%",
  minWidth: 560,
  paddingLeft: 8,
  paddingRight: 8,
};

/** Marker styling by score-to-par, matching the design scorecard. */
function markerClass(toPar: number): string {
  if (toPar <= -2)
    return "border-[1.5px] border-gold rounded-full shadow-[0_0_0_2px_rgba(201,162,75,0.22)] text-gold2"; // eagle+
  if (toPar === -1) return "border-[1.5px] border-sage rounded-full text-sage"; // birdie
  if (toPar === 0) return "text-muted"; // par
  if (toPar === 1) return "border-[1.5px] border-rose rounded-[7px] text-rose"; // bogey
  return "bg-rose rounded-[7px] text-[#1A1408] font-semibold"; // double+
}

/** A single fixed-size, centered hole cell — the marker never changes the cell width. */
function HoleCell({ hole }: { hole: HoleScore | null }) {
  return (
    <div className="flex items-center justify-center h-[34px]">
      <span
        className={`flex items-center justify-center not-italic text-[13px] font-medium tnum ${
          hole ? markerClass(hole.toPar) : "text-faint opacity-45"
        }`}
        style={{ width: MARKER, height: MARKER }}
      >
        {hole ? hole.strokes : "–"}
      </span>
    </div>
  );
}

function totalColor(score: string): string {
  if (score === "E" || score === "0") return "text-ink";
  if (score.startsWith("-")) return "text-sage";
  return "text-rose";
}

/** One round: a hole-number header row and a score row on the same fixed grid. */
export function RoundHoles({ round }: { round: RoundScore }) {
  const holes = round.holes ?? [];
  if (holes.length === 0) return null;

  // Index by hole number so every round always renders all 18 columns (missing
  // holes show a blank dash) — this keeps every round aligned with the others.
  const byHole = new Map(holes.map((h) => [h.hole, h]));
  const cells = Array.from({ length: 18 }, (_, i) => byHole.get(i + 1) ?? null);

  return (
    <div className="pt-3.5">
      <div className="text-[10.5px] tracking-[2px] uppercase text-faint pb-2.5">
        Round {round.round}
      </div>

      {/* Hole numbers + TOT label */}
      <div style={GRID_COLS}>
        {cells.map((_, i) => (
          <span key={i} className="text-center text-[10px] text-faint tnum">
            {i + 1}
          </span>
        ))}
        <span className="text-right text-[9px] font-semibold tracking-[1px] uppercase text-muted border-l border-line2 pl-1.5">
          Tot
        </span>
      </div>

      {/* Scores + round total */}
      <div style={GRID_COLS} className="mt-1">
        {cells.map((hole, i) => (
          <HoleCell key={i} hole={hole} />
        ))}
        <span
          className={`flex items-center justify-end h-[34px] text-[15px] font-semibold tnum border-l border-line2 pl-1.5 ${totalColor(
            round.score
          )}`}
        >
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
        <i className="w-[15px] h-[15px] border-[1.5px] border-rose rounded-[4px]" />
        Bogey
      </span>
      <span className="flex items-center gap-2 text-[11px] tracking-[0.5px] text-muted">
        <i className="w-[15px] h-[15px] bg-rose rounded-[4px]" />
        Double+
      </span>
    </div>
  );
}
