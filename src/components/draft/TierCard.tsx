"use client";

import { DraftGolfer } from "@/lib/draft/types";
import { TournamentTheme } from "@/lib/tournaments";

interface TierCardProps {
  tierName: string;
  tierNumber: number;
  golfers: DraftGolfer[];
  selectedGolfer: string | null;
  onSelect: (name: string) => void;
  disabled: boolean;
  theme: TournamentTheme;
}

export default function TierCard({
  tierName,
  tierNumber,
  golfers,
  selectedGolfer,
  onSelect,
  disabled,
  theme,
}: TierCardProps) {
  return (
    <div className="bg-card rounded-lg border border-edge overflow-hidden">
      {/* Tier header */}
      <div className="px-4 py-2.5 border-b border-edge flex items-center justify-between">
        <span className="text-[10px] uppercase tracking-wider text-faint font-semibold">
          {tierName}
        </span>
        <span className="text-[10px] uppercase tracking-wider font-semibold" style={{ color: theme.accentMuted }}>
          Tier {tierNumber}
        </span>
      </div>

      {/* Golfer list */}
      <div className="divide-y divide-white/5">
        {golfers.map((golfer) => {
          const isSelected = selectedGolfer === golfer.name;
          return (
            <button
              key={golfer.name}
              onClick={() => !disabled && onSelect(golfer.name)}
              disabled={disabled}
              className={`w-full px-4 py-3 flex items-center justify-between text-left transition-colors ${
                disabled ? "cursor-default" : "cursor-pointer hover:bg-white/5"
              }`}
              style={isSelected ? { backgroundColor: theme.highlightBg } : undefined}
            >
              <span className={`text-sm ${isSelected ? "text-white font-medium" : "text-gray-400"}`}>
                {golfer.name}
              </span>
              {isSelected && (
                <svg className="w-4 h-4 shrink-0" style={{ color: theme.badgeText }} fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
