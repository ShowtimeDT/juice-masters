"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { TOURNAMENTS, TournamentConfig } from "@/lib/tournaments";
import { Draft, DraftGolfer } from "@/lib/draft/types";
import TierEditor from "@/components/admin/TierEditor";

interface LeagueData {
  league: { id: string; name: string; slug: string; commissioner_id: string; invite_code: string };
  members: { user_id: string; display_name: string; email: string }[];
}

const tournamentConfigs = TOURNAMENTS.filter((t) => t.id !== "season");

function getCloseTimeOptions(firstTeeTime: string) {
  const tee = new Date(firstTeeTime);
  return [
    { label: "1 day before first tee", value: new Date(tee.getTime() - 24 * 60 * 60 * 1000).toISOString() },
    { label: "1 hour before first tee", value: new Date(tee.getTime() - 60 * 60 * 1000).toISOString() },
    { label: "15 minutes before first tee", value: new Date(tee.getTime() - 15 * 60 * 1000).toISOString() },
    { label: "1 minute before first tee", value: new Date(tee.getTime() - 60 * 1000).toISOString() },
  ];
}

function canFetchField(config: TournamentConfig): boolean {
  if (!config.firstTeeTime) return false;
  const tee = new Date(config.firstTeeTime);
  const monday = new Date(tee);
  monday.setDate(monday.getDate() - 3);
  monday.setHours(0, 0, 0, 0);
  return new Date() >= monday;
}

function statusColor(status: string) {
  if (status === "pending") return "bg-purple-500/20 text-purple-400";
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

  // Tier editor state
  const [editingDraftId, setEditingDraftId] = useState<string | null>(null);
  const [editingGolfers, setEditingGolfers] = useState<DraftGolfer[]>([]);
  const [selectedCloseTime, setSelectedCloseTime] = useState<string>("");

  // Fetch state
  const [fetching, setFetching] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const leagueRes = await fetch(`/api/leagues/${slug}`);
      if (!leagueRes.ok) { setError("League not found"); setLoading(false); return; }
      const ld = await leagueRes.json();
      setLeagueData(ld);

      if (session?.user?.id !== ld.league.commissioner_id) {
        setError("Only the commissioner can manage this league");
        setLoading(false);
        return;
      }

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

  const fetchField = async (tournamentId: string) => {
    if (!leagueData) return;
    setFetching(tournamentId);
    try {
      const res = await fetch("/api/draft/auto-populate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tournament_id: tournamentId, league_id: leagueData.league.id }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "Failed to fetch field");
      } else {
        // Open tier editor
        setEditingDraftId(data.draft.id);
        setEditingGolfers(data.golfers);
        const config = tournamentConfigs.find((t) => t.id === tournamentId);
        if (config?.firstTeeTime) {
          const options = getCloseTimeOptions(config.firstTeeTime);
          setSelectedCloseTime(options[2].value); // Default: 15 min before
        }
        fetchData();
      }
    } catch {
      alert("Failed to fetch field");
    }
    setFetching(null);
  };

  const saveTiers = async (golfers: { name: string; espn_id: string; tier_number: number }[]) => {
    if (!editingDraftId) return;
    await fetch(`/api/draft/${editingDraftId}/golfers`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        golfers: golfers.map((g) => ({ tier_number: g.tier_number, name: g.name, espn_id: g.espn_id })),
      }),
    });
  };

  const startDraft = async (draftId: string) => {
    // Set close time
    if (selectedCloseTime) {
      await fetch(`/api/draft/${draftId}/close-time`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ close_time: selectedCloseTime }),
      });
    }

    // Only change status to open if currently pending (starting for the first time)
    // If already open, just save the settings changes
    const currentDraft = drafts.find((d) => d.id === draftId);
    if (currentDraft?.status !== "open") {
      await fetch(`/api/draft/${draftId}/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-admin-password": "commissioner" },
        body: JSON.stringify({ status: "open" }),
      });
    }

    setEditingDraftId(null);
    fetchData();
  };

  const changeStatus = async (draftId: string, newStatus: string) => {
    await fetch(`/api/draft/${draftId}/status`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-admin-password": "commissioner" },
      body: JSON.stringify({ status: newStatus }),
    });
    fetchData();
  };

  const reviewDraft = async (draftId: string) => {
    const res = await fetch(`/api/draft/${draftId}`);
    const data = await res.json();
    setEditingDraftId(draftId);
    setEditingGolfers(data.golfers);
    const draft = drafts.find((d) => d.id === draftId);
    const config = tournamentConfigs.find((t) => t.id === draft?.tournament_id);
    if (config?.firstTeeTime) {
      const options = getCloseTimeOptions(config.firstTeeTime);
      setSelectedCloseTime(options[2].value);
    }
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
              onClick={() => navigator.clipboard.writeText(`${window.location.origin}/league/${slug}/join/${leagueData.league.invite_code}`)}
              className="px-3 py-2 bg-[#C8A951] text-black font-semibold text-xs rounded-lg hover:bg-[#d4b96a] transition-colors cursor-pointer shrink-0"
            >
              Copy
            </button>
          </div>
          <p className="text-gray-500 text-xs mt-2">
            {leagueData.members.length} member{leagueData.members.length !== 1 ? "s" : ""} in league
          </p>
        </div>

        {/* Tier Editor (shown when reviewing a draft) */}
        {editingDraftId && (
          <div className="bg-[#1e2124] rounded-lg border border-[#3a3e3a] p-4 space-y-4">
            <TierEditor
              initialGolfers={editingGolfers.map((g) => ({ name: g.name, espn_id: g.espn_id, tier_number: g.tier_number }))}
              numTiers={8}
              onSave={saveTiers}
            />

            <div className="border-t border-[#3a3e3a] pt-4">
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <label className="text-[10px] uppercase tracking-wider text-[#5a5e5a] font-semibold block mb-1.5">
                    Draft Closes
                  </label>
                  <select
                    value={selectedCloseTime}
                    onChange={(e) => setSelectedCloseTime(e.target.value)}
                    className="w-full bg-[#111314] border border-[#3a3e3a] rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#C8A951]"
                  >
                    {(() => {
                      const draft = drafts.find((d) => d.id === editingDraftId);
                      const config = tournamentConfigs.find((t) => t.id === draft?.tournament_id);
                      if (!config?.firstTeeTime) return null;
                      return getCloseTimeOptions(config.firstTeeTime).map((opt) => (
                        <option key={opt.label} value={opt.value}>{opt.label}</option>
                      ));
                    })()}
                  </select>
                </div>
                <button
                  onClick={() => startDraft(editingDraftId)}
                  className="px-6 py-2.5 bg-green-600 text-white font-semibold text-sm rounded-lg hover:bg-green-500 transition-colors cursor-pointer mt-5"
                >
                  {drafts.find((d) => d.id === editingDraftId)?.status === "open" ? "Save Changes" : "Start Draft"}
                </button>
                <button
                  onClick={() => setEditingDraftId(null)}
                  className="px-4 py-2.5 text-gray-400 text-sm hover:text-white cursor-pointer mt-5"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Tournament Cards (hidden when editing tiers) */}
        {!editingDraftId && <h2 className="text-white font-bold text-sm uppercase tracking-wide">Tournaments</h2>}
        {!editingDraftId && <div className="space-y-3">
          {tournamentConfigs.map((config) => {
            const draft = drafts.find((d) => d.tournament_id === config.id);
            const fieldAvailable = canFetchField(config);
            const hasDraft = !!draft;

            return (
              <div
                key={config.id}
                className="bg-[#1e2124] rounded-lg border border-[#3a3e3a] p-4"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-white font-semibold text-sm">{config.name}</h3>
                      {draft && (
                        <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${statusColor(draft.status)}`}>
                          {draft.status}
                        </span>
                      )}
                    </div>
                    <p className="text-gray-500 text-xs mt-1">{config.dates} · {config.venue}</p>
                  </div>

                  <div className="flex items-center gap-2">
                    {!hasDraft && !fieldAvailable && (
                      <span className="text-gray-500 text-xs">Field not available yet</span>
                    )}
                    {!hasDraft && fieldAvailable && (
                      <button
                        onClick={() => fetchField(config.id)}
                        disabled={fetching === config.id}
                        className="px-4 py-2 bg-green-600 text-white font-semibold text-xs rounded-lg hover:bg-green-500 transition-colors cursor-pointer disabled:opacity-50"
                      >
                        {fetching === config.id ? "Fetching..." : "Fetch Field & Create Draft"}
                      </button>
                    )}
                    {draft?.status === "pending" && (
                      <button
                        onClick={() => reviewDraft(draft.id)}
                        className="px-4 py-2 bg-purple-600 text-white font-semibold text-xs rounded-lg hover:bg-purple-500 transition-colors cursor-pointer"
                      >
                        Review & Start Draft
                      </button>
                    )}
                    {draft?.status === "open" && (
                      <>
                        <button
                          onClick={() => reviewDraft(draft.id)}
                          className="px-3 py-1.5 text-xs font-medium rounded-lg bg-[#111314] border border-[#3a3e3a] text-gray-300 hover:text-white hover:border-[#C8A951] transition-colors cursor-pointer"
                        >
                          Edit Tiers / Settings
                        </button>
                        <button
                          onClick={() => { changeStatus(draft.id, "pending"); }}
                          className="px-3 py-1.5 text-xs text-yellow-400 hover:text-white cursor-pointer"
                        >
                          Pause Draft
                        </button>
                        <button
                          onClick={() => changeStatus(draft.id, "locked")}
                          className="px-4 py-2 bg-blue-600 text-white font-semibold text-xs rounded-lg hover:bg-blue-500 transition-colors cursor-pointer"
                        >
                          Lock Draft
                        </button>
                      </>
                    )}
                    {draft?.status === "locked" && (
                      <button
                        onClick={() => changeStatus(draft.id, "open")}
                        className="px-3 py-1.5 text-xs text-yellow-400 hover:text-white cursor-pointer"
                      >
                        Reopen
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>}
      </main>
    </div>
  );
}
