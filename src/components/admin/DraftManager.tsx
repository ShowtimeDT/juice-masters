"use client";

import { useState, useEffect, useCallback } from "react";
import { DraftData } from "@/lib/draft/types";

interface DraftManagerProps {
  draftId: string;
  adminPassword: string;
  onBack: () => void;
}

function statusColor(status: string) {
  if (status === "open") return "bg-green-500/20 text-green-400";
  if (status === "closed") return "bg-yellow-500/20 text-yellow-400";
  if (status === "locked") return "bg-blue-500/20 text-blue-400";
  return "bg-gray-500/20 text-gray-400";
}

export default function DraftManager({ draftId, adminPassword, onBack }: DraftManagerProps) {
  const [data, setData] = useState<DraftData | null>(null);
  const [loading, setLoading] = useState(true);
  const [newMember, setNewMember] = useState("");
  const [bulkMembers, setBulkMembers] = useState("");
  const [showBulk, setShowBulk] = useState(false);

  const fetchData = useCallback(async () => {
    const res = await fetch(`/api/draft/${draftId}`);
    const d = await res.json();
    setData(d);
    setLoading(false);
  }, [draftId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const changeStatus = async (status: string) => {
    await fetch(`/api/draft/${draftId}/status`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-admin-password": adminPassword,
      },
      body: JSON.stringify({ status }),
    });
    fetchData();
  };

  const addMember = async () => {
    if (!newMember.trim() || !data) return;
    const members = [...data.members.map((m) => m.name), newMember.trim()];
    await fetch(`/api/draft/${draftId}/members`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ members }),
    });
    setNewMember("");
    fetchData();
  };

  const addBulkMembers = async () => {
    if (!bulkMembers.trim() || !data) return;
    const newNames = bulkMembers.split("\n").map((n) => n.trim()).filter(Boolean);
    const existing = data.members.map((m) => m.name);
    const all = [...new Set([...existing, ...newNames])];
    await fetch(`/api/draft/${draftId}/members`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ members: all }),
    });
    setBulkMembers("");
    setShowBulk(false);
    fetchData();
  };

  const removeMember = async (name: string) => {
    if (!data) return;
    const members = data.members.filter((m) => m.name !== name).map((m) => m.name);
    await fetch(`/api/draft/${draftId}/members`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ members }),
    });
    fetchData();
  };

  if (loading || !data) {
    return (
      <div className="min-h-screen bg-[#1a1a1a] flex items-center justify-center">
        <p className="text-gray-400 text-sm">Loading draft...</p>
      </div>
    );
  }

  const { draft, tiers, golfers, picks, members } = data;

  // Group picks by owner
  const picksByOwner = new Map<string, typeof picks>();
  for (const pick of picks) {
    const ownerPicks = picksByOwner.get(pick.owner) || [];
    ownerPicks.push(pick);
    picksByOwner.set(pick.owner, ownerPicks);
  }

  return (
    <div className="min-h-screen bg-[#1a1a1a]">
      <header className="bg-[#111314] border-b border-[#2a2e2a] px-4 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={onBack} className="text-gray-400 hover:text-white text-sm cursor-pointer">
              ← Back
            </button>
            <h1 className="text-white font-serif text-xl font-bold">{draft.name}</h1>
            <span className={`text-[10px] font-bold uppercase px-2 py-1 rounded ${statusColor(draft.status)}`}>
              {draft.status}
            </span>
          </div>
          <div className="flex gap-2">
            {draft.status === "open" && (
              <button onClick={() => changeStatus("closed")} className="px-3 py-1.5 text-xs font-medium rounded-lg bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30 transition-colors cursor-pointer">
                Close Draft
              </button>
            )}
            {draft.status === "closed" && (
              <>
                <button onClick={() => changeStatus("open")} className="px-3 py-1.5 text-xs font-medium rounded-lg bg-green-500/20 text-green-400 hover:bg-green-500/30 transition-colors cursor-pointer">
                  Reopen
                </button>
                <button onClick={() => changeStatus("locked")} className="px-3 py-1.5 text-xs font-medium rounded-lg bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 transition-colors cursor-pointer">
                  Lock Draft
                </button>
              </>
            )}
            {draft.status === "locked" && (
              <button onClick={() => changeStatus("closed")} className="px-3 py-1.5 text-xs font-medium rounded-lg bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30 transition-colors cursor-pointer">
                Unlock
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8 space-y-6">
        {/* Tiers & Golfers */}
        <div className="bg-[#1e2124] rounded-lg border border-[#3a3e3a] overflow-hidden">
          <div className="px-4 py-3 border-b border-[#3a3e3a]">
            <h2 className="text-white font-bold text-sm uppercase tracking-wide">
              Tiers & Golfers ({tiers.length} tiers, {golfers.length} golfers)
            </h2>
          </div>
          <div className="divide-y divide-white/5">
            {tiers.map((tier) => {
              const tierGolfers = golfers.filter((g) => g.tier_number === tier.tier_number);
              return (
                <div key={tier.tier_number} className="px-4 py-3">
                  <h3 className="text-[10px] uppercase tracking-wider text-[#5a5e5a] font-semibold mb-2">
                    {tier.name}
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {tierGolfers.map((g) => (
                      <span key={g.name} className="text-xs text-gray-300 bg-[#111314] px-2 py-1 rounded">
                        {g.name}
                      </span>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Members */}
        <div className="bg-[#1e2124] rounded-lg border border-[#3a3e3a] overflow-hidden">
          <div className="px-4 py-3 border-b border-[#3a3e3a] flex items-center justify-between">
            <h2 className="text-white font-bold text-sm uppercase tracking-wide">
              Members ({members.length})
            </h2>
            <button
              onClick={() => setShowBulk(!showBulk)}
              className="text-[10px] text-[#C8A951] hover:text-white uppercase tracking-wider cursor-pointer"
            >
              {showBulk ? "Single Add" : "Bulk Add"}
            </button>
          </div>
          <div className="px-4 py-3">
            {showBulk ? (
              <div className="space-y-2">
                <textarea
                  value={bulkMembers}
                  onChange={(e) => setBulkMembers(e.target.value)}
                  placeholder="One name per line"
                  rows={5}
                  className="w-full bg-[#111314] border border-[#3a3e3a] rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#C8A951]"
                />
                <button onClick={addBulkMembers} className="px-3 py-1.5 text-xs font-medium rounded-lg bg-[#C8A951] text-black cursor-pointer">
                  Add Members
                </button>
              </div>
            ) : (
              <div className="flex gap-2 mb-3">
                <input
                  value={newMember}
                  onChange={(e) => setNewMember(e.target.value)}
                  placeholder="Member name"
                  className="flex-1 bg-[#111314] border border-[#3a3e3a] rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#C8A951]"
                  onKeyDown={(e) => e.key === "Enter" && addMember()}
                />
                <button onClick={addMember} className="px-3 py-1.5 text-xs font-medium rounded-lg bg-[#C8A951] text-black cursor-pointer">
                  Add
                </button>
              </div>
            )}
            <div className="flex flex-wrap gap-2 mt-2">
              {members.map((m) => (
                <span key={m.name} className="text-xs text-gray-300 bg-[#111314] px-2 py-1 rounded flex items-center gap-1.5">
                  {m.name}
                  <button onClick={() => removeMember(m.name)} className="text-gray-500 hover:text-red-400 cursor-pointer">×</button>
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Picks */}
        <div className="bg-[#1e2124] rounded-lg border border-[#3a3e3a] overflow-hidden">
          <div className="px-4 py-3 border-b border-[#3a3e3a]">
            <h2 className="text-white font-bold text-sm uppercase tracking-wide">
              Picks ({picksByOwner.size} / {members.length} members)
            </h2>
          </div>
          {picksByOwner.size === 0 ? (
            <div className="px-4 py-6 text-center">
              <p className="text-gray-500 text-sm">No picks submitted yet.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <div className="min-w-[40rem]">
                <div className="grid grid-cols-[8rem_repeat(8,1fr)_4rem] px-4 py-1.5 text-[10px] uppercase tracking-wider text-[#5a5e5a] font-semibold border-b border-[#3a3e3a]">
                  <span>Member</span>
                  {Array.from({ length: 8 }, (_, i) => (
                    <span key={i} className="text-center">T{i + 1}</span>
                  ))}
                  <span className="text-right">TB</span>
                </div>
                {Array.from(picksByOwner.entries()).map(([owner, ownerPicks]) => {
                  const sorted = [...ownerPicks].sort((a, b) => a.tier_number - b.tier_number);
                  const tb = sorted.find((p) => p.tiebreaker_guess != null)?.tiebreaker_guess;
                  return (
                    <div key={owner} className="grid grid-cols-[8rem_repeat(8,1fr)_4rem] items-center px-4 py-2 text-xs border-b border-white/5 last:border-0">
                      <span className="text-white font-medium truncate">{owner}</span>
                      {Array.from({ length: 8 }, (_, i) => {
                        const pick = sorted.find((p) => p.tier_number === i + 1);
                        return (
                          <span key={i} className="text-center text-gray-400 truncate px-1">
                            {pick ? pick.golfer_name.split(" ").pop() : "—"}
                          </span>
                        );
                      })}
                      <span className="text-right text-gray-400 font-mono">{tb ?? "—"}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
