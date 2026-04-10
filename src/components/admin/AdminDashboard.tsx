"use client";

import { useState, useEffect, useCallback } from "react";
import { Draft } from "@/lib/draft/types";
import { TOURNAMENTS } from "@/lib/tournaments";
import { MOCK_PGA_DRAFT } from "@/lib/draft/mock-pga";
import DraftManager from "./DraftManager";

interface AdminDashboardProps {
  adminPassword: string;
}

const tournamentOptions = TOURNAMENTS.filter((t) => t.id !== "season");

function statusColor(status: string) {
  if (status === "open") return "bg-green-500/20 text-green-400";
  if (status === "closed") return "bg-yellow-500/20 text-yellow-400";
  if (status === "locked") return "bg-blue-500/20 text-blue-400";
  return "bg-gray-500/20 text-gray-400";
}

export default function AdminDashboard({ adminPassword }: AdminDashboardProps) {
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [selectedDraftId, setSelectedDraftId] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [newDraftTournament, setNewDraftTournament] = useState("pga");
  const [newDraftName, setNewDraftName] = useState("");
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);

  const fetchDrafts = useCallback(async () => {
    const res = await fetch("/api/draft/list");
    const data = await res.json();
    setDrafts(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchDrafts();
  }, [fetchDrafts]);

  const createDraft = async () => {
    if (!newDraftName.trim()) return;
    await fetch("/api/draft/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tournament_id: newDraftTournament, name: newDraftName }),
    });
    setNewDraftName("");
    setShowCreate(false);
    fetchDrafts();
  };

  const seedMockDraft = async () => {
    setSeeding(true);
    try {
      // Create draft
      const createRes = await fetch("/api/draft/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tournament_id: MOCK_PGA_DRAFT.tournament_id,
          name: MOCK_PGA_DRAFT.name,
        }),
      });
      const draft = await createRes.json();

      // Add tiers
      await fetch(`/api/draft/${draft.id}/tiers`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tiers: MOCK_PGA_DRAFT.tiers }),
      });

      // Add golfers
      await fetch(`/api/draft/${draft.id}/golfers`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ golfers: MOCK_PGA_DRAFT.golfers }),
      });

      // Add members
      await fetch(`/api/draft/${draft.id}/members`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ members: MOCK_PGA_DRAFT.members }),
      });

      fetchDrafts();
    } catch (err) {
      console.error("Seed error:", err);
    }
    setSeeding(false);
  };

  if (selectedDraftId) {
    return (
      <DraftManager
        draftId={selectedDraftId}
        adminPassword={adminPassword}
        onBack={() => { setSelectedDraftId(null); fetchDrafts(); }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#1a1a1a]">
      <header className="bg-[#111314] border-b border-[#2a2e2a] px-4 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <h1 className="text-white font-serif text-xl font-bold">Juice Tour Admin</h1>
          <div className="flex gap-2">
            <button
              onClick={seedMockDraft}
              disabled={seeding}
              className="px-3 py-1.5 text-xs font-medium rounded-lg bg-[#1e2124] border border-[#3a3e3a] text-gray-300 hover:text-white hover:border-[#C8A951] transition-colors cursor-pointer disabled:opacity-50"
            >
              {seeding ? "Seeding..." : "Seed PGA Mock Draft"}
            </button>
            <button
              onClick={() => setShowCreate(!showCreate)}
              className="px-3 py-1.5 text-xs font-medium rounded-lg bg-[#C8A951] text-black hover:bg-[#d4b96a] transition-colors cursor-pointer"
            >
              Create Draft
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8">
        {/* Create draft form */}
        {showCreate && (
          <div className="bg-[#1e2124] rounded-lg border border-[#3a3e3a] p-4 mb-6">
            <h2 className="text-white font-semibold text-sm mb-3">New Draft</h2>
            <div className="flex gap-3">
              <select
                value={newDraftTournament}
                onChange={(e) => setNewDraftTournament(e.target.value)}
                className="bg-[#111314] border border-[#3a3e3a] rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#C8A951]"
              >
                {tournamentOptions.map((t) => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
              <input
                type="text"
                value={newDraftName}
                onChange={(e) => setNewDraftName(e.target.value)}
                placeholder="Draft name"
                className="flex-1 bg-[#111314] border border-[#3a3e3a] rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#C8A951]"
              />
              <button
                onClick={createDraft}
                className="px-4 py-2 bg-[#C8A951] text-black font-semibold text-sm rounded-lg hover:bg-[#d4b96a] transition-colors cursor-pointer"
              >
                Create
              </button>
            </div>
          </div>
        )}

        {/* Drafts list */}
        {loading ? (
          <p className="text-gray-500 text-sm">Loading drafts...</p>
        ) : drafts.length === 0 ? (
          <div className="bg-[#1e2124] rounded-lg border border-[#3a3e3a] p-8 text-center">
            <p className="text-gray-400 text-sm">No drafts yet. Create one or seed a mock draft.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {drafts.map((draft) => {
              const tournament = tournamentOptions.find((t) => t.id === draft.tournament_id);
              return (
                <button
                  key={draft.id}
                  onClick={() => setSelectedDraftId(draft.id)}
                  className="w-full bg-[#1e2124] rounded-lg border border-[#3a3e3a] hover:border-[#4a4e4a] transition-colors p-4 flex items-center justify-between text-left cursor-pointer"
                >
                  <div>
                    <h3 className="text-white font-semibold text-sm">{draft.name}</h3>
                    <p className="text-gray-500 text-xs mt-1">
                      {tournament?.name || draft.tournament_id} · Created {new Date(draft.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <span className={`text-[10px] font-bold uppercase px-2 py-1 rounded ${statusColor(draft.status)}`}>
                    {draft.status}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
