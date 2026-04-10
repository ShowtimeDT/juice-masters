"use client";

import { useState } from "react";

interface Golfer {
  name: string;
  espn_id: string;
  tier_number: number;
}

interface TierEditorProps {
  initialGolfers: Golfer[];
  numTiers: number;
  onSave: (golfers: Golfer[]) => Promise<void>;
  onGolfersChange?: (golfers: Golfer[]) => void;
  hideTopSaveButton?: boolean;
}

export default function TierEditor({ initialGolfers, numTiers, onSave, onGolfersChange, hideTopSaveButton }: TierEditorProps) {
  const [golfers, setGolfers] = useState<Golfer[]>(initialGolfers);
  const [saving, setSaving] = useState(false);

  const moveGolfer = (golferName: string, fromTier: number, toTier: number) => {
    if (toTier < 1 || toTier > numTiers) return;
    setGolfers((prev) => {
      const updated = prev.map((g) =>
        g.name === golferName && g.tier_number === fromTier
          ? { ...g, tier_number: toTier }
          : g
      );
      onGolfersChange?.(updated);
      return updated;
    });
  };

  const handleSave = async () => {
    setSaving(true);
    await onSave(golfers);
    setSaving(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-white font-bold text-sm uppercase tracking-wide">Review Tiers</h3>
        {!hideTopSaveButton && (
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 bg-[#C8A951] text-black font-semibold text-xs rounded-lg hover:bg-[#d4b96a] transition-colors cursor-pointer disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save Tier Changes"}
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {Array.from({ length: numTiers }, (_, i) => i + 1).map((tierNum) => {
          const tierGolfers = golfers
            .filter((g) => g.tier_number === tierNum)
            .sort((a, b) => a.name.localeCompare(b.name));

          return (
            <div key={tierNum} className="bg-[#111314] rounded-lg border border-[#3a3e3a] overflow-hidden">
              <div className="px-3 py-2 border-b border-[#3a3e3a] flex items-center justify-between">
                <span className="text-[10px] uppercase tracking-wider text-[#5a5e5a] font-semibold">
                  Tier {tierNum}
                </span>
                <span className="text-[10px] text-gray-500">{tierGolfers.length} golfers</span>
              </div>
              <div className="max-h-[20rem] overflow-y-auto">
                {tierGolfers.map((g) => (
                  <div
                    key={g.name}
                    className="flex items-center justify-between px-2 py-1.5 border-b border-white/5 last:border-0 text-xs"
                  >
                    <span className="text-gray-300 truncate flex-1">{g.name}</span>
                    <div className="flex gap-0.5 shrink-0 ml-1">
                      <button
                        onClick={() => moveGolfer(g.name, tierNum, tierNum - 1)}
                        disabled={tierNum === 1}
                        className="w-5 h-5 flex items-center justify-center text-gray-500 hover:text-white disabled:opacity-20 cursor-pointer disabled:cursor-default"
                        title={`Move to Tier ${tierNum - 1}`}
                      >
                        ↑
                      </button>
                      <button
                        onClick={() => moveGolfer(g.name, tierNum, tierNum + 1)}
                        disabled={tierNum === numTiers}
                        className="w-5 h-5 flex items-center justify-center text-gray-500 hover:text-white disabled:opacity-20 cursor-pointer disabled:cursor-default"
                        title={`Move to Tier ${tierNum + 1}`}
                      >
                        ↓
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
