import { GolferScoreWithCounting } from "@/lib/types";

interface GolferRowProps {
  golfer: GolferScoreWithCounting;
}

function scoreColor(score: number): string {
  if (score < 0) return "text-[#4ade80]";
  if (score > 0) return "text-[#f87171]";
  return "text-gray-300";
}

export default function GolferRow({ golfer }: GolferRowProps) {
  const opacity = golfer.isCounting ? "opacity-100" : "opacity-40";

  return (
    <div
      className={`grid grid-cols-[2rem_minmax(7rem,1fr)_3.5rem_1rem_repeat(4,3rem)_3rem] sm:grid-cols-[2.5rem_1fr_4rem_1.5rem_repeat(4,3.5rem)_3.5rem] items-center py-2 px-3 text-sm border-b border-white/5 last:border-0 ${opacity}`}
    >
      {/* Tier */}
      <span className="text-gray-500 text-xs font-medium">T{golfer.tier}</span>

      {/* Name + cut badge */}
      <div className="flex items-center gap-2 min-w-0">
        <span className="text-gray-200 text-xs sm:text-sm whitespace-nowrap">
          <span className="sm:hidden">{golfer.name.split(" ")[0][0]}. {golfer.name.split(" ").slice(1).join(" ")}</span>
          <span className="hidden sm:inline">{golfer.name}</span>
        </span>
        {golfer.missedCut && (
          <span className="text-[10px] font-bold bg-red-500/20 text-red-400 px-1.5 py-0.5 rounded shrink-0">
            CUT
          </span>
        )}
      </div>

      {/* Total score */}
      <span className={`text-right font-mono font-semibold text-xs sm:text-sm ${scoreColor(golfer.effectiveScore)}`}>
        {golfer.scoreDisplay === "-" ? "-" : golfer.missedCut
          ? `${golfer.scoreDisplay} (+10)`
          : golfer.scoreDisplay}
      </span>

      {/* Spacer between score and rounds */}
      <span></span>

      {/* R1 - R4 scores (always show all 4) */}
      {[0, 1, 2, 3].map((i) => {
        const round = golfer.rounds[i];
        return (
          <span key={i} className="text-center text-xs text-gray-400 font-mono">
            {round?.score || "-"}
          </span>
        );
      })}

      {/* Thru */}
      <span className="text-center text-xs text-gray-500">{golfer.thru}</span>
    </div>
  );
}
