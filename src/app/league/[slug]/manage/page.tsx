"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { TOURNAMENTS } from "@/lib/tournaments";
import { Draft } from "@/lib/draft/types";
import PrivacyCard from "@/components/manage/PrivacyCard";

interface LeagueMember {
  id: number;
  user_id: string | null;
  display_name: string;
  team_name: string | null;
  username: string | null;
}

interface LeagueData {
  league: { id: string; name: string; slug: string; commissioner_id: string; invite_code: string; is_private?: boolean };
  members: LeagueMember[];
}

const tournamentConfigs = TOURNAMENTS.filter((t) => t.id !== "season");

function canFetchField(firstTeeTime: string): boolean {
  if (!firstTeeTime) return false;
  const tee = new Date(firstTeeTime);
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

  const unlinkMember = async (member: LeagueMember) => {
    if (!leagueData) return;
    if (!confirm(`Unlink ${member.display_name}? They'll need to claim their name again from the invite link.`)) {
      return;
    }
    try {
      const res = await fetch("/api/leagues/members/link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ league_id: leagueData.league.id, member_id: member.id }),
      });
      if (!res.ok) {
        const data = await res.json();
        alert(data.error || "Failed to unlink member");
        return;
      }
      fetchData();
    } catch {
      alert("Failed to unlink member");
    }
  };

  const deleteLeague = async () => {
    if (!leagueData) return;
    const typed = prompt(
      `This permanently deletes "${leagueData.league.name}" — all drafts, picks, and standings. ` +
        `Type the league name to confirm:`
    );
    if (typed === null) return;
    if (typed.trim() !== leagueData.league.name) {
      alert("Name didn't match — nothing was deleted.");
      return;
    }
    try {
      const res = await fetch(`/api/leagues/${leagueData.league.id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "Failed to delete league");
        return;
      }
      router.replace("/");
    } catch {
      alert("Failed to delete league");
    }
  };

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
        // Navigate to the tournament settings page
        router.push(`/league/${slug}/manage/${tournamentId}`);
      }
    } catch {
      alert("Failed to fetch field");
    }
    setFetching(null);
  };

  if (loading || authStatus === "loading") {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <div className="inline-block w-8 h-8 border-2 border-brand border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400 text-sm">{error}</p>
          <a href={`/league/${slug}`} className="text-brand text-sm mt-4 inline-block">Back to league</a>
        </div>
      </div>
    );
  }

  if (!leagueData) return null;

  return (
    <div className="min-h-screen bg-surface">
      <header className="bg-card-inset border-b border-edge px-4 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <a href={`/league/${slug}`} className="text-gray-400 hover:text-white text-sm">← Back</a>
            <h1 className="text-white font-serif text-xl font-bold">Manage {leagueData.league.name}</h1>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8 space-y-6">
        {/* Invite Link */}
        <div className="bg-card rounded-lg border border-edge p-4">
          <h2 className="text-white font-bold text-sm uppercase tracking-wide mb-3">Invite Link</h2>
          <div className="flex gap-2 items-center">
            <code className="flex-1 bg-card-inset border border-edge rounded-lg px-3 py-2 text-brand text-xs font-mono overflow-x-auto">
              {typeof window !== "undefined" ? `${window.location.origin}/league/${slug}/join/${leagueData.league.invite_code}` : ""}
            </code>
            <button
              onClick={() => navigator.clipboard.writeText(`${window.location.origin}/league/${slug}/join/${leagueData.league.invite_code}`)}
              className="px-3 py-2 bg-brand text-black font-semibold text-xs rounded-lg hover:bg-brand-hover transition-colors cursor-pointer shrink-0"
            >
              Copy
            </button>
          </div>
          <p className="text-gray-500 text-xs mt-2">
            {leagueData.members.length} member{leagueData.members.length !== 1 ? "s" : ""} in league
          </p>
        </div>

        {/* Privacy */}
        <PrivacyCard leagueId={leagueData.league.id} onSaved={fetchData} />

        {/* Members */}
        <div className="bg-card rounded-lg border border-edge overflow-hidden">
          <div className="px-4 py-3 border-b border-edge">
            <h2 className="text-white font-bold text-sm uppercase tracking-wide">Members</h2>
            <p className="text-gray-500 text-xs mt-1">
              Unclaimed members appear when someone joins via the invite link and can claim their name.
            </p>
          </div>
          <div>
            {leagueData.members.map((member) => (
              <div
                key={member.id}
                className="flex items-center justify-between px-4 py-2.5 border-b border-white/5 last:border-0"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-gray-200 text-sm truncate">{member.display_name}</span>
                  {member.user_id === leagueData.league.commissioner_id && (
                    <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded bg-brand/20 text-brand shrink-0">
                      Commissioner
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  {member.user_id ? (
                    <>
                      <span className="text-green-400 text-xs">
                        Claimed{member.username ? ` — @${member.username}` : ""}
                      </span>
                      {member.user_id !== leagueData.league.commissioner_id && (
                        <button
                          onClick={() => unlinkMember(member)}
                          className="text-gray-500 text-xs hover:text-red-400 transition-colors cursor-pointer"
                        >
                          Unlink
                        </button>
                      )}
                    </>
                  ) : (
                    <span className="text-gray-500 text-xs">Unclaimed</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Tournament Cards */}
        <h2 className="text-white font-bold text-sm uppercase tracking-wide">Tournaments</h2>
        <div className="space-y-3">
          {tournamentConfigs.map((config) => {
            const draft = drafts.find((d) => d.tournament_id === config.id);
            const fieldAvailable = canFetchField(config.firstTeeTime);
            const hasDraft = !!draft;

            return (
              <div
                key={config.id}
                className="bg-card rounded-lg border border-edge p-4"
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
                    {hasDraft && (
                      <a
                        href={`/league/${slug}/manage/${config.id}`}
                        className="px-4 py-2 text-xs font-medium rounded-lg bg-card-inset border border-edge text-gray-300 hover:text-white hover:border-brand transition-colors"
                      >
                        Settings
                      </a>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Danger zone */}
        <div className="bg-card rounded-lg border border-red-500/30 p-4">
          <h2 className="text-red-400 font-bold text-sm uppercase tracking-wide mb-1">Danger Zone</h2>
          <div className="flex items-center justify-between gap-4">
            <p className="text-gray-500 text-xs">
              Permanently delete this league, including all drafts, picks, and standings.
              This cannot be undone.
            </p>
            <button
              onClick={deleteLeague}
              className="px-4 py-2 bg-red-500/10 border border-red-500/40 text-red-400 font-semibold text-xs rounded-lg hover:bg-red-500/20 transition-colors cursor-pointer shrink-0"
            >
              Delete League
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
