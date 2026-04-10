import { EntryStanding } from "@/lib/types";

interface TiebreakerPanelProps {
  standings: EntryStanding[];
  actualBirdies: number;
}

export default function TiebreakerPanel({
  standings,
  actualBirdies,
}: TiebreakerPanelProps) {
  const sorted = [...standings].sort((a, b) => {
    const diffA = Math.abs(a.entry.tiebreakerGuess - actualBirdies);
    const diffB = Math.abs(b.entry.tiebreakerGuess - actualBirdies);
    return diffA - diffB;
  });

  return (
    <div className="bg-[#1e2124] rounded-lg border border-[#3a3e3a] overflow-hidden">
      {/* Header */}
      <div className="px-3 sm:px-4 py-3 border-b border-[#3a3e3a] flex items-center justify-between">
        <h2 className="text-white font-bold text-sm sm:text-base uppercase tracking-wide">
          Tiebreaker: Total Birdies
        </h2>
        <div className="flex items-center gap-2">
          <span className="text-gray-400 text-xs uppercase tracking-wider">Actual:</span>
          <span className="text-white font-mono font-bold text-xl">
            {actualBirdies}
          </span>
        </div>
      </div>

      {/* Column headers */}
      <div className="grid grid-cols-[1fr_6rem_6rem] sm:grid-cols-[1fr_8rem_8rem] px-3 sm:px-4 py-1.5 text-[10px] uppercase tracking-wider text-[#5a5e5a] font-semibold border-b border-[#3a3e3a]">
        <span>Player</span>
        <span className="text-right">Guess</span>
        <span className="text-right">Differential</span>
      </div>

      {/* Rows */}
      <div>
        {sorted.map((standing, i) => {
          const diff = standing.entry.tiebreakerGuess - actualBirdies;
          const isClosest = i === 0;

          return (
            <div
              key={standing.entry.id}
              className={`grid grid-cols-[1fr_6rem_6rem] sm:grid-cols-[1fr_8rem_8rem] items-center px-3 sm:px-4 py-2.5 text-sm border-b border-white/5 last:border-0 ${
                isClosest ? "bg-[#006747]/15" : ""
              }`}
            >
              <div className="flex items-center gap-2 min-w-0">
                <span className={`${isClosest ? "text-white font-medium" : "text-gray-400"} truncate`}>
                  {standing.entry.name}
                </span>
                {isClosest && (
                  <span className="text-[10px] font-bold bg-[#006747]/30 text-[#4ade80] px-1.5 py-0.5 rounded shrink-0">
                    CLOSEST
                  </span>
                )}
              </div>
              <span className="text-gray-300 font-mono text-right">
                {standing.entry.tiebreakerGuess}
              </span>
              <span className="text-gray-500 font-mono text-right">
                {diff === 0 ? "exact" : diff > 0 ? `+${diff}` : diff.toString()}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
