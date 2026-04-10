"use client";

import { useState, useEffect } from "react";
import { DraftData } from "@/lib/draft/types";
import { useTheme } from "@/lib/ThemeContext";
import TierCard from "./TierCard";

interface DraftPickViewProps {
  draftData: DraftData;
  onPicksSubmitted: () => void;
}

export default function DraftPickView({ draftData, onPicksSubmitted }: DraftPickViewProps) {
  const theme = useTheme();
  const { draft, tiers, golfers, picks, members } = draftData;

  const [selectedOwner, setSelectedOwner] = useState("");
  const [selections, setSelections] = useState<Record<number, string>>({});
  const [tiebreaker, setTiebreaker] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  const isOpen = draft.status === "open";
  const isClosed = draft.status === "closed" || draft.status === "locked";

  // Load existing picks when owner changes
  useEffect(() => {
    if (!selectedOwner) {
      setSelections({});
      setTiebreaker("");
      setSubmitted(false);
      return;
    }

    const ownerPicks = picks.filter((p) => p.owner === selectedOwner);
    if (ownerPicks.length > 0) {
      const sel: Record<number, string> = {};
      for (const p of ownerPicks) {
        sel[p.tier_number] = p.golfer_name;
      }
      setSelections(sel);
      const tb = ownerPicks.find((p) => p.tiebreaker_guess != null)?.tiebreaker_guess;
      setTiebreaker(tb?.toString() || "");
      setSubmitted(true);
    } else {
      setSelections({});
      setTiebreaker("");
      setSubmitted(false);
    }
  }, [selectedOwner, picks]);

  const handleSelect = (tierNumber: number, golferName: string) => {
    setSelections((prev) => ({
      ...prev,
      [tierNumber]: prev[tierNumber] === golferName ? "" : golferName,
    }));
    setSubmitted(false);
  };

  const allTiersPicked = tiers.every((t) => selections[t.tier_number]);
  const canSubmit = isOpen && selectedOwner && allTiersPicked && tiebreaker.trim() !== "";

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    setError("");

    try {
      const picksPayload = tiers.map((t) => ({
        tier_number: t.tier_number,
        golfer_name: selections[t.tier_number],
      }));

      const res = await fetch(`/api/draft/${draft.id}/pick`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          owner: selectedOwner,
          picks: picksPayload,
          tiebreaker_guess: parseInt(tiebreaker),
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to submit picks");
      } else {
        setSubmitted(true);
        onPicksSubmitted();
      }
    } catch {
      setError("Failed to submit picks");
    }
    setSubmitting(false);
  };

  return (
    <main className="max-w-5xl mx-auto px-4 py-8 space-y-4">
      {/* Status banner */}
      {isClosed && (
        <div
          className="rounded-lg px-4 py-3 text-sm text-center font-medium"
          style={{ backgroundColor: theme.highlightBg, color: theme.badgeText }}
        >
          {draft.status === "locked" ? "Draft is locked — picks are final" : "Draft is closed — no more changes"}
        </div>
      )}

      {/* Name selector */}
      <div className="bg-[#1e2124] rounded-lg border border-[#3a3e3a] p-4">
        <label className="text-[10px] uppercase tracking-wider text-[#5a5e5a] font-semibold block mb-2">
          Select Your Name
        </label>
        <select
          value={selectedOwner}
          onChange={(e) => setSelectedOwner(e.target.value)}
          className="w-full bg-[#111314] border border-[#3a3e3a] rounded-lg px-4 py-3 text-white text-sm focus:outline-none transition-colors"
          style={{ borderColor: selectedOwner ? theme.accent : "#3a3e3a" }}
        >
          <option value="">Choose your name...</option>
          {members.map((m) => (
            <option key={m.name} value={m.name}>{m.name}</option>
          ))}
        </select>
      </div>

      {/* Tier cards */}
      {selectedOwner && (
        <>
          {/* Progress indicator */}
          <div className="flex items-center justify-between px-1">
            <span className="text-[10px] uppercase tracking-wider text-[#5a5e5a] font-semibold">
              {Object.values(selections).filter(Boolean).length} / {tiers.length} tiers selected
            </span>
            {submitted && (
              <span
                className="text-[10px] font-bold uppercase px-2 py-1 rounded"
                style={{ backgroundColor: `${theme.primary}30`, color: theme.badgeText }}
              >
                Picks Submitted
              </span>
            )}
          </div>

          {tiers.map((tier) => {
            const tierGolfers = golfers.filter((g) => g.tier_number === tier.tier_number);
            return (
              <TierCard
                key={tier.tier_number}
                tierName={tier.name}
                tierNumber={tier.tier_number}
                golfers={tierGolfers}
                selectedGolfer={selections[tier.tier_number] || null}
                onSelect={(name) => handleSelect(tier.tier_number, name)}
                disabled={isClosed}
              />
            );
          })}

          {/* Tiebreaker */}
          <div className="bg-[#1e2124] rounded-lg border border-[#3a3e3a] p-4">
            <label className="text-[10px] uppercase tracking-wider text-[#5a5e5a] font-semibold block mb-2">
              Tiebreaker — Total Birdies Guess
            </label>
            <input
              type="number"
              value={tiebreaker}
              onChange={(e) => { setTiebreaker(e.target.value); setSubmitted(false); }}
              placeholder="Enter your guess for total birdies"
              disabled={isClosed}
              className="w-full bg-[#111314] border border-[#3a3e3a] rounded-lg px-4 py-3 text-white text-sm focus:outline-none transition-colors disabled:opacity-50"
              style={{ borderColor: tiebreaker ? theme.accent : "#3a3e3a" }}
            />
          </div>

          {/* Submit */}
          {isOpen && (
            <div className="pt-2">
              {error && <p className="text-red-400 text-xs mb-2">{error}</p>}
              <button
                onClick={handleSubmit}
                disabled={!canSubmit || submitting}
                className="w-full py-4 text-white font-semibold text-sm rounded-lg transition-colors disabled:opacity-30 cursor-pointer"
                style={{ backgroundColor: theme.primary }}
              >
                {submitting ? "Submitting..." : submitted ? "Update Picks" : "Submit Picks"}
              </button>
            </div>
          )}
        </>
      )}
    </main>
  );
}
