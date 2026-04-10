"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { TOURNAMENTS } from "@/lib/tournaments";
import { MOCK_PGA_DRAFT } from "@/lib/draft/mock-pga";

interface LeagueData {
  league: { id: string; name: string; slug: string; commissioner_id: string; invite_code: string };
  members: { user_id: string; display_name: string; email: string }[];
}

interface Draft {
  id: string;
  tournament_id: string;
  name: string;
  status: string;
  league_id: string;
}

const tournamentOptions = TOURNAMENTS.filter((t) => t.id !== "season");

function statusColor(status: string) {
  if (status === "open") return "bg-green-500/20 text-green-400";
  if (status === "closed") return "bg-yellow-500/20 text-yellow-400";
  if (status === "locked") return "bg-blue-500/20 text-blue-400";
  return "bg-gray-500/20 text-gray-400";
}

export default function ManageLeaguePage() {
  const params = useParams();
  const router = useRouter();
  const { data: session, status: authStatus } = useSession();
  const slug = params.slug as string;

  const [leagueData, setLeagueData] = useState<LeagueData | null>(null);
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Draft creation
  const [showCreateDraft, setShowCreateDraft] = useState(false);
  const [newDraftTournament, setNewDraftTournament] = useState("pga");
  const [newDraftName, setNewDraftName] = useState("");
  const [seeding, setSeeding] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const leagueRes = await fetch(`/api/leagues/${slug}`);
      if (!leagueRes.ok) {
        setError("League not found");
        setLoading(false);
        return;
      }
      const ld = await leagueRes.json();
      setLeagueData(ld);

      // Check commissioner
      if (session?.user?.id !== ld.league.commissioner_id) {
        setError("Only the commissioner can manage this league");
        setLoading(false);
        return;
      }

      // Fetch drafts for this league
      const draftsRes = await fetch("/api/draft/list");
      if (draftsRes.ok) {
        const allDrafts = await draftsRes.json();
        setDrafts(allDrafts.filter((d: Draft) => d.league_id === ld.league.id));
      }
    } catch {
      setError("Failed to load league");
    }
    setLoading(false);
  }, [slug, session?.user?.id]);

  useEffect(() => {
    if (authStatus === "authenticated") fetchData();
    else if (authStatus === "unauthenticated") router.replace(`/login?callbackUrl=/league/${slug}/manage`);
  }, [authStatus, fetchData, router, slug]);

  const createDraft = async () => {
    if (!newDraftName.trim() || !leagueData) return;
    await fetch("/api/draft/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        tournament_id: newDraftTournament,
        name: newDraftName,
        league_id: leagueData.league.id,
      }),
    });
    setNewDraftName("");
    setShowCreateDraft(false);
    fetchData();
  };

  const seedMockDraft = async () => {
    if (!leagueData) return;
    setSeeding(true);
    try {
      const createRes = await fetch("/api/draft/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tournament_id: MOCK_PGA_DRAFT.tournament_id,
          name: MOCK_PGA_DRAFT.name,
          league_id: leagueData.league.id,
        }),
      });
      const draft = await createRes.json();

      await fetch(`/api/draft/${draft.id}/tiers`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tiers: MOCK_PGA_DRAFT.tiers }),
      });

      await fetch(`/api/draft/${draft.id}/golfers`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ golfers: MOCK_PGA_DRAFT.golfers }),
      });

      await fetch(`/api/draft/${draft.id}/members`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ members: MOCK_PGA_DRAFT.members }),
      });

      fetchData();
    } catch (err) {
      console.error("Seed error:", err);
    }
    setSeeding(false);
  };

  const changeStatus = async (draftId: string, newStatus: string) => {
    await fetch(`/api/draft/${draftId}/status`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-admin-password": "commissioner" },
      body: JSON.stringify({ status: newStatus }),
    });
    fetchData();
  };

  if (loading || authStatus === "loading") {
    return (
      <div className="min-h-screen bg-[#1a1a1a] flex items-center justify-center">
        <div className="inline-block w-8 h-8 border-2 border-[#C8A951] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#1a1a1a] flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400 text-sm">{error}</p>
          <a href={`/league/${slug}`} className="text-[#C8A951] text-sm mt-4 inline-block">Back to league</a>
        </div>
      </div>
    );
  }

  if (!leagueData) return null;

  return (
    <div className="min-h-screen bg-[#1a1a1a]">
      <header className="bg-[#111314] border-b border-[#2a2e2a] px-4 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <a href={`/league/${slug}`} className="text-gray-400 hover:text-white text-sm">← Back</a>
            <h1 className="text-white font-serif text-xl font-bold">Manage {leagueData.league.name}</h1>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8 space-y-6">
        {/* Invite Link */}
        <div className="bg-[#1e2124] rounded-lg border border-[#3a3e3a] p-4">
          <h2 className="text-white font-bold text-sm uppercase tracking-wide mb-3">Invite Link</h2>
          <div className="flex gap-2 items-center">
            <code className="flex-1 bg-[#111314] border border-[#3a3e3a] rounded-lg px-3 py-2 text-[#C8A951] text-xs font-mono overflow-x-auto">
              {typeof window !== "undefined" ? `${window.location.origin}/league/${slug}/join/${leagueData.league.invite_code}` : ""}
            </code>
            <button
              onClick={() => {
                navigator.clipboard.writeText(`${window.location.origin}/league/${slug}/join/${leagueData.league.invite_code}`);
              }}
              className="px-3 py-2 bg-[#C8A951] text-black font-semibold text-xs rounded-lg hover:bg-[#d4b96a] transition-colors cursor-pointer shrink-0"
            >
              Copy
            </button>
          </div>
          <p className="text-gray-500 text-xs mt-2">Share this link with people you want to join your league.</p>
        </div>

        {/* Members */}
        <div className="bg-[#1e2124] rounded-lg border border-[#3a3e3a] p-4">
          <h2 className="text-white font-bold text-sm uppercase tracking-wide mb-3">
            Members ({leagueData.members.length})
          </h2>
          <div className="space-y-2">
            {leagueData.members.map((m) => (
              <div key={m.user_id} className="flex items-center justify-between py-1.5 border-b border-white/5 last:border-0">
                <span className="text-gray-300 text-sm">{m.display_name}</span>
                <span className="text-gray-500 text-xs">{m.email}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Drafts */}
        <div className="bg-[#1e2124] rounded-lg border border-[#3a3e3a] p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-white font-bold text-sm uppercase tracking-wide">Drafts</h2>
            <div className="flex gap-2">
              <button
                onClick={seedMockDraft}
                disabled={seeding}
                className="px-3 py-1.5 text-xs font-medium rounded-lg bg-[#111314] border border-[#3a3e3a] text-gray-300 hover:text-white hover:border-[#C8A951] transition-colors cursor-pointer disabled:opacity-50"
              >
                {seeding ? "Seeding..." : "Seed PGA Mock"}
              </button>
              <button
                onClick={() => setShowCreateDraft(!showCreateDraft)}
                className="px-3 py-1.5 text-xs font-medium rounded-lg bg-[#C8A951] text-black hover:bg-[#d4b96a] transition-colors cursor-pointer"
              >
                Create Draft
              </button>
            </div>
          </div>

          {showCreateDraft && (
            <div className="flex gap-2 mb-4">
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
                value={newDraftName}
                onChange={(e) => setNewDraftName(e.target.value)}
                placeholder="Draft name"
                className="flex-1 bg-[#111314] border border-[#3a3e3a] rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#C8A951]"
              />
              <button
                onClick={createDraft}
                className="px-4 py-2 bg-[#C8A951] text-black font-semibold text-sm rounded-lg cursor-pointer"
              >
                Create
              </button>
            </div>
          )}

          {drafts.length === 0 ? (
            <p className="text-gray-500 text-sm">No drafts yet. Create one for your league.</p>
          ) : (
            <div className="space-y-2">
              {drafts.map((draft) => {
                const tournament = tournamentOptions.find((t) => t.id === draft.tournament_id);
                return (
                  <div key={draft.id} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                    <div>
                      <span className="text-gray-300 text-sm">{draft.name}</span>
                      <span className="text-gray-500 text-xs ml-2">{tournament?.shortName}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-bold uppercase px-2 py-1 rounded ${statusColor(draft.status)}`}>
                        {draft.status}
                      </span>
                      {draft.status === "open" && (
                        <button onClick={() => changeStatus(draft.id, "closed")} className="text-yellow-400 text-xs hover:text-white cursor-pointer">Close</button>
                      )}
                      {draft.status === "closed" && (
                        <>
                          <button onClick={() => changeStatus(draft.id, "open")} className="text-green-400 text-xs hover:text-white cursor-pointer">Reopen</button>
                          <button onClick={() => changeStatus(draft.id, "locked")} className="text-blue-400 text-xs hover:text-white cursor-pointer">Lock</button>
                        </>
                      )}
                      {draft.status === "locked" && (
                        <button onClick={() => changeStatus(draft.id, "closed")} className="text-yellow-400 text-xs hover:text-white cursor-pointer">Unlock</button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
