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

const ArrowUp = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
    <path d="M12 19V5M5 12l7-7 7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const ArrowDown = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
    <path d="M12 5v14M5 12l7 7 7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

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
      // Defer parent state update to avoid updating during render
      setTimeout(() => onGolfersChange?.(updated), 0);
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
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-sans text-[12px] font-semibold uppercase tracking-[0.16em] text-ink">
            Review Tiers
          </h2>
          <p className="mt-1 text-[12.5px] text-muted">
            Hover a golfer and use ↑ ↓ to move them between tiers.
          </p>
        </div>
        {!hideTopSaveButton && (
          <button
            onClick={handleSave}
            disabled={saving}
            className="btn-gold rounded-lg px-4 py-2 text-xs font-semibold transition-transform hover:-translate-y-px cursor-pointer disabled:opacity-50"
          >
            {saving ? "Saving…" : "Save Tier Changes"}
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: numTiers }, (_, i) => i + 1).map((tierNum) => {
          const tierGolfers = golfers
            .filter((g) => g.tier_number === tierNum)
            .sort((a, b) => a.name.localeCompare(b.name));

          return (
            <div key={tierNum} className="flex flex-col overflow-hidden rounded-[14px] border border-edge bg-card">
              <div className="flex items-center justify-between border-b border-line2 bg-bg2 px-3.5 py-3">
                <span className="font-sans text-[11px] font-semibold uppercase tracking-[0.16em] text-gold">
                  Tier {tierNum}
                </span>
                <span className="text-[10.5px] text-faint">
                  {tierGolfers.length} golfer{tierGolfers.length !== 1 ? "s" : ""}
                </span>
              </div>
              <div className="max-h-[20rem] overflow-y-auto p-1.5">
                {tierGolfers.map((g) => (
                  <div
                    key={g.name}
                    className="group flex items-center gap-1.5 rounded-lg px-2 py-1.5 transition-colors hover:bg-white/[0.025]"
                  >
                    <span className="min-w-0 flex-1 truncate text-[13px] text-text">{g.name}</span>
                    <div className="flex shrink-0 gap-0.5 opacity-50 transition-opacity group-hover:opacity-100">
                      <button
                        onClick={() => moveGolfer(g.name, tierNum, tierNum - 1)}
                        disabled={tierNum === 1}
                        className="flex h-6 w-6 items-center justify-center rounded-md border border-edge text-muted transition-colors hover:border-gold/50 hover:text-gold2 disabled:cursor-not-allowed disabled:opacity-25 cursor-pointer"
                        title={`Move to Tier ${tierNum - 1}`}
                        aria-label="Move up a tier"
                      >
                        <ArrowUp />
                      </button>
                      <button
                        onClick={() => moveGolfer(g.name, tierNum, tierNum + 1)}
                        disabled={tierNum === numTiers}
                        className="flex h-6 w-6 items-center justify-center rounded-md border border-edge text-muted transition-colors hover:border-gold/50 hover:text-gold2 disabled:cursor-not-allowed disabled:opacity-25 cursor-pointer"
                        title={`Move to Tier ${tierNum + 1}`}
                        aria-label="Move down a tier"
                      >
                        <ArrowDown />
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
