"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { TOURNAMENTS, TournamentConfig } from "@/lib/tournaments";
import { Draft, DraftGolfer } from "@/lib/draft/types";
import TierEditor from "@/components/admin/TierEditor";

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

function statusColor(status: string) {
  if (status === "pending") return "bg-purple-500/20 text-purple-400";
  if (status === "open") return "bg-green-500/20 text-green-400";
  if (status === "closed") return "bg-yellow-500/20 text-yellow-400";
  if (status === "locked") return "bg-blue-500/20 text-blue-400";
  return "bg-gray-500/20 text-gray-400";
}

interface LeagueData {
  league: { id: string; name: string; slug: string; commissioner_id: string };
}

export default function TournamentSettingsPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session, status: authStatus } = useSession();
  const slug = params.slug as string;
  const tournamentId = params.tournamentId as string;

  const config = tournamentConfigs.find((t) => t.id === tournamentId) as TournamentConfig | undefined;

  const [leagueData, setLeagueData] = useState<LeagueData | null>(null);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [golfers, setGolfers] = useState<DraftGolfer[]>([]);
  const [selectedCloseTime, setSelectedCloseTime] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

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

      // Find draft for this tournament in this league
      const draftsRes = await fetch("/api/draft/list");
      if (draftsRes.ok) {
        const allDrafts: Draft[] = await draftsRes.json();
        const d = allDrafts.find((dr) => dr.tournament_id === tournamentId && dr.league_id === ld.league.id);
        if (d) {
          setDraft(d);
          // Fetch full draft data for golfers
          const draftRes = await fetch(`/api/draft/${d.id}`);
          const draftData = await draftRes.json();
          setGolfers(draftData.golfers || []);

          // Set close time
          if (d.close_time) {
            setSelectedCloseTime(d.close_time);
          } else if (config?.firstTeeTime) {
            const options = getCloseTimeOptions(config.firstTeeTime);
            setSelectedCloseTime(options[2].value); // Default: 15 min before
          }
        }
      }
    } catch {
      setError("Failed to load data");
    }
    setLoading(false);
  }, [slug, session?.user?.id, tournamentId, config?.firstTeeTime]);

  useEffect(() => {
    if (authStatus === "authenticated") fetchData();
    else if (authStatus === "unauthenticated") router.replace(`/login?callbackUrl=/league/${slug}/manage`);
  }, [authStatus, fetchData, router, slug]);

  const saveTiers = async (updatedGolfers: { name: string; espn_id: string; tier_number: number }[]) => {
    if (!draft) return;
    await fetch(`/api/draft/${draft.id}/golfers`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        golfers: updatedGolfers.map((g) => ({ tier_number: g.tier_number, name: g.name, espn_id: g.espn_id })),
      }),
    });
  };

  const saveCloseTime = async () => {
    if (!draft || !selectedCloseTime) return;
    setSaving(true);
    await fetch(`/api/draft/${draft.id}/close-time`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ close_time: selectedCloseTime }),
    });
    setSaving(false);
  };

  const startDraft = async () => {
    if (!draft) return;
    setSaving(true);

    // Save close time
    if (selectedCloseTime) {
      await fetch(`/api/draft/${draft.id}/close-time`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ close_time: selectedCloseTime }),
      });
    }

    // Set status to open (only if not already open)
    if (draft.status !== "open") {
      await fetch(`/api/draft/${draft.id}/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-admin-password": "commissioner" },
        body: JSON.stringify({ status: "open" }),
      });
    }

    setSaving(false);
    router.push(`/league/${slug}/manage`);
  };

  const changeStatus = async (newStatus: string) => {
    if (!draft) return;
    await fetch(`/api/draft/${draft.id}/status`, {
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

  if (error || !config) {
    return (
      <div className="min-h-screen bg-[#1a1a1a] flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400 text-sm">{error || "Tournament not found"}</p>
          <a href={`/league/${slug}/manage`} className="text-[#C8A951] text-sm mt-4 inline-block">Back</a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#1a1a1a]">
      <header className="bg-[#111314] border-b border-[#2a2e2a] px-4 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <a href={`/league/${slug}/manage`} className="text-gray-400 hover:text-white text-sm cursor-pointer">← Back</a>
            <h1 className="text-white font-serif text-xl font-bold">{config.name} Settings</h1>
            {draft && (
              <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${statusColor(draft.status)}`}>
                {draft.status}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {draft?.status === "pending" && (
              <button
                onClick={startDraft}
                disabled={saving}
                className="px-4 py-2 bg-green-600 text-white font-semibold text-xs rounded-lg hover:bg-green-500 transition-colors cursor-pointer disabled:opacity-50"
              >
                {saving ? "Starting..." : "Start Draft"}
              </button>
            )}
            {draft?.status === "open" && (
              <>
                <button
                  onClick={() => { saveCloseTime(); }}
                  disabled={saving}
                  className="px-3 py-1.5 text-xs font-medium rounded-lg bg-[#C8A951] text-black hover:bg-[#d4b96a] transition-colors cursor-pointer disabled:opacity-50"
                >
                  {saving ? "Saving..." : "Save Changes"}
                </button>
                <button
                  onClick={() => changeStatus("pending")}
                  className="px-3 py-1.5 text-xs text-yellow-400 hover:text-white cursor-pointer"
                >
                  Pause Draft
                </button>
                <button
                  onClick={() => changeStatus("locked")}
                  className="px-3 py-1.5 text-xs font-medium rounded-lg bg-blue-600 text-white hover:bg-blue-500 transition-colors cursor-pointer"
                >
                  Lock Draft
                </button>
              </>
            )}
            {draft?.status === "locked" && (
              <button
                onClick={() => changeStatus("open")}
                className="px-3 py-1.5 text-xs text-yellow-400 hover:text-white cursor-pointer"
              >
                Reopen
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8 space-y-6">
        {!draft && (
          <div className="bg-[#1e2124] rounded-lg border border-[#3a3e3a] p-8 text-center">
            <p className="text-gray-400 text-sm">No draft has been created for this tournament yet.</p>
            <p className="text-gray-500 text-xs mt-1">Go back and use "Fetch Field & Create Draft" to get started.</p>
          </div>
        )}

        {draft && (
          <>
            {/* Close Time Setting */}
            <div className="bg-[#1e2124] rounded-lg border border-[#3a3e3a] p-4">
              <label className="text-[10px] uppercase tracking-wider text-[#5a5e5a] font-semibold block mb-2">
                Draft Closes
              </label>
              <select
                value={selectedCloseTime}
                onChange={(e) => setSelectedCloseTime(e.target.value)}
                className="w-full bg-[#111314] border border-[#3a3e3a] rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-[#C8A951]"
              >
                {config.firstTeeTime && getCloseTimeOptions(config.firstTeeTime).map((opt) => (
                  <option key={opt.label} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>

            {/* Tier Editor */}
            {golfers.length > 0 && (
              <div className="bg-[#1e2124] rounded-lg border border-[#3a3e3a] p-4">
                <TierEditor
                  initialGolfers={golfers.map((g) => ({ name: g.name, espn_id: g.espn_id, tier_number: g.tier_number }))}
                  numTiers={8}
                  onSave={saveTiers}
                />
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
