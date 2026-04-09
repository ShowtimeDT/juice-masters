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
    <div className="bg-[#2d2d2d] rounded-lg border border-white/5 overflow-hidden">
      <div className="px-4 py-3 border-b border-white/5 flex items-center justify-between">
        <h2 className="text-white font-semibold text-sm sm:text-base">
          Tiebreaker: Total Birdies
        </h2>
        <div className="flex items-center gap-2">
          <span className="text-gray-400 text-xs">Actual:</span>
          <span className="text-[#4ade80] font-mono font-bold text-lg">
            {actualBirdies}
          </span>
        </div>
      </div>
      <div className="divide-y divide-white/5">
        {sorted.map((standing, i) => {
          const diff = standing.entry.tiebreakerGuess - actualBirdies;
          const absDiff = Math.abs(diff);
          const isClosest = i === 0;

          return (
            <div
              key={standing.entry.id}
              className={`flex items-center justify-between px-4 py-2.5 text-sm ${
                isClosest ? "bg-[#006747]/15" : ""
              }`}
            >
              <div className="flex items-center gap-3">
                {isClosest && (
                  <span className="text-[10px] font-bold bg-[#006747]/30 text-[#4ade80] px-1.5 py-0.5 rounded">
                    CLOSEST
                  </span>
                )}
                <span className={`${isClosest ? "text-white font-medium" : "text-gray-400"}`}>
                  {standing.entry.name}
                </span>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-gray-300 font-mono">
                  {standing.entry.tiebreakerGuess}
                </span>
                <span className={`font-mono text-xs w-16 text-right ${absDiff === 0 ? "text-[#4ade80]" : "text-gray-500"}`}>
                  {diff === 0 ? "exact" : diff > 0 ? `+${diff}` : diff.toString()}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
