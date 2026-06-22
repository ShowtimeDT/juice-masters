"use client";

import { DraftGolfer } from "@/lib/draft/types";
import { TournamentTheme } from "@/lib/tournaments";
import Headshot from "@/components/ui/Headshot";

interface TierCardProps {
  tierName: string;
  tierNumber: number;
  golfers: DraftGolfer[];
  selectedGolfer: string | null;
  onSelect: (name: string) => void;
  disabled: boolean;
  /** Kept for API compatibility; the redesign uses the centralized gold tokens. */
  theme: TournamentTheme;
}

const lastName = (name: string) => name.split(" ").pop() || name;

export default function TierCard({
  tierNumber,
  golfers,
  selectedGolfer,
  onSelect,
  disabled,
}: TierCardProps) {
  const picked = Boolean(selectedGolfer);

  return (
    <div
      className={`flex flex-col overflow-hidden rounded-[14px] bg-card border transition-colors ${
        picked ? "border-gold/30" : "border-edge"
      }`}
    >
      {/* Tier header */}
      <div className="flex items-center justify-between px-3.5 py-3 border-b border-line2 bg-bg2">
        <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-gold">
          Tier {tierNumber}
        </span>
        <span className={`text-[10.5px] ${picked ? "text-sage" : "text-faint"}`}>
          {picked ? lastName(selectedGolfer as string) : "Pick one"}
        </span>
      </div>

      {/* Golfer list */}
      <div className="p-1.5">
        {golfers.map((golfer) => {
          const isSelected = selectedGolfer === golfer.name;
          return (
            <button
              key={golfer.name}
              onClick={() => !disabled && onSelect(golfer.name)}
              disabled={disabled}
              className={`group flex w-full items-center gap-2.5 rounded-[9px] px-2 py-1.5 text-left transition-colors ${
                disabled ? "cursor-default" : "cursor-pointer hover:bg-white/[0.03]"
              } ${isSelected ? "bg-goldsoft" : ""}`}
            >
              <Headshot name={golfer.name} espnId={golfer.espn_id || undefined} size={28} />
              <span
                className={`min-w-0 flex-1 truncate text-[13px] ${
                  isSelected ? "text-ink font-medium" : "text-text"
                }`}
              >
                {golfer.name}
              </span>
              <span
                className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition-colors ${
                  isSelected
                    ? "border-transparent bg-gradient-to-b from-gold2 to-gold text-[#1A1408]"
                    : "border-edge text-transparent group-hover:border-faint"
                }`}
              >
                <svg viewBox="0 0 24 24" fill="none" className="h-3 w-3">
                  <path
                    d="M5 12l5 5L19 7"
                    stroke="currentColor"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
