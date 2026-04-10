"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { TournamentConfig } from "@/lib/tournaments";
import { DraftData } from "@/lib/draft/types";
import { Entry } from "@/lib/types";
import TournamentHeader from "./TournamentHeader";
import TournamentPlaceholder from "./TournamentPlaceholder";
import DraftPickView from "./draft/DraftPickView";
import Leaderboard from "./Leaderboard";
import AuthModal from "./auth/AuthModal";
import { useTheme } from "@/lib/ThemeContext";

interface DraftAwareTournamentProps {
  config: TournamentConfig;
  leagueId?: string;
  isMember?: boolean;
}

export default function DraftAwareTournament({ config, leagueId, isMember }: DraftAwareTournamentProps) {
  const { data: session } = useSession();
  const theme = useTheme();
  const [draftData, setDraftData] = useState<DraftData | null>(null);
  const [draftEntries, setDraftEntries] = useState<Entry[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showDraftPicker, setShowDraftPicker] = useState(false);

  const fetchDraft = useCallback(async () => {
    try {
      const leagueParam = leagueId ? `?league_id=${leagueId}` : "";
      const url = `/api/draft/tournament/${config.id}${leagueParam}`;
      const res = await fetch(url);
      const data = await res.json();

      if (!data || !data.draft) {
        setDraftData(null);
        setDraftEntries(null);
        setLoading(false);
        return;
      }

      setDraftData(data);

      if (data.draft.status === "locked") {
        const entriesRes = await fetch(`/api/draft/${data.draft.id}/entries`);
        if (entriesRes.ok) {
          const entries = await entriesRes.json();
          setDraftEntries(entries);
        }
      } else {
        setDraftEntries(null);
      }
    } catch {
      setDraftData(null);
      setDraftEntries(null);
    }
    setLoading(false);
  }, [config.id, leagueId]);

  useEffect(() => {
    fetchDraft();
  }, [fetchDraft]);

  if (loading) {
    return (
      <div>
        <TournamentHeader tournamentName={config.name} roundStatus={config.dates} lastUpdated={null} onRefresh={() => {}} />
        <div className="flex items-center justify-center py-20">
          <div className="inline-block w-8 h-8 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: config.theme.primary, borderTopColor: "transparent" }} />
        </div>
      </div>
    );
  }

  // No draft → placeholder
  if (!draftData) {
    return (
      <>
        <TournamentHeader tournamentName={config.name} roundStatus={config.dates} lastUpdated={null} onRefresh={() => {}} />
        <TournamentPlaceholder config={config} />
      </>
    );
  }

  // Draft locked with entries → full leaderboard
  if (draftData.draft.status === "locked" && draftEntries && draftEntries.length > 0) {
    return <Leaderboard config={config} entries={draftEntries} />;
  }

  // Draft is open or closed → show member list + Draft Now
  const pickCounts = draftData.pickCounts || [];
  const userHasPicked = session?.user?.name && pickCounts.some((pc) => pc.owner === session.user?.name);

  // If user clicked "Draft Now", show the pick view
  if (showDraftPicker && session?.user) {
    return (
      <>
        <TournamentHeader tournamentName={config.name} roundStatus={draftData.draft.status === "open" ? "Draft Open" : "Draft Closed"} lastUpdated={null} onRefresh={() => {}} />
        <div className="max-w-5xl mx-auto px-4 pt-4">
          <button
            onClick={() => setShowDraftPicker(false)}
            className="text-gray-400 text-sm hover:text-white transition-colors cursor-pointer mb-2"
          >
            ← Back to standings
          </button>
        </div>
        <DraftPickView
          draftData={draftData}
          config={config}
          onPicksSubmitted={() => { fetchDraft(); setShowDraftPicker(false); }}
          leagueId={leagueId}
          isMember={isMember}
        />
      </>
    );
  }

  const isOpen = draftData.draft.status === "open";
  const closeTimeStr = draftData.draft.close_time
    ? new Date(draftData.draft.close_time).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })
    : null;

  return (
    <>
      <TournamentHeader tournamentName={config.name} roundStatus={isOpen ? "Draft Open" : "Draft Closed"} lastUpdated={null} onRefresh={() => {}} />

      <main className="max-w-5xl mx-auto px-4 py-8 space-y-4">
        {/* Deadline / status banner */}
        {isOpen && closeTimeStr && (
          <div className="rounded-lg px-4 py-3 text-center" style={{ backgroundColor: theme.highlightBg }}>
            <p className="text-sm font-medium" style={{ color: theme.badgeText }}>
              Draft closes {closeTimeStr}
            </p>
          </div>
        )}
        {!isOpen && (
          <div className="rounded-lg px-4 py-3 text-sm text-center font-medium" style={{ backgroundColor: theme.highlightBg, color: theme.badgeText }}>
            Draft is {draftData.draft.status === "locked" ? "locked — picks are final" : "closed"}
          </div>
        )}

        {/* Draft Now button */}
        {isOpen && session?.user && isMember && (
          <button
            onClick={() => setShowDraftPicker(true)}
            className="w-full py-4 text-white font-semibold text-sm rounded-lg transition-colors cursor-pointer"
            style={{ backgroundColor: theme.primary }}
          >
            {userHasPicked ? "Update Picks" : "Draft Now"}
          </button>
        )}

        {isOpen && !session?.user && (
          <div className="bg-[#1e2124] rounded-lg border border-[#3a3e3a] p-6 text-center">
            <p className="text-gray-300 text-sm mb-3">Sign in to make your picks</p>
            <button
              onClick={() => setShowAuthModal(true)}
              className="px-6 py-2.5 text-black font-semibold text-sm rounded-lg transition-colors cursor-pointer"
              style={{ backgroundColor: theme.accent }}
            >
              Sign In / Create Account
            </button>
          </div>
        )}

        {showAuthModal && (
          <AuthModal onClose={() => setShowAuthModal(false)} onSuccess={() => { setShowAuthModal(false); fetchDraft(); }} />
        )}

        {/* Member list with picks-in indicators */}
        <div className="bg-[#1e2124] rounded-lg border border-[#3a3e3a] overflow-hidden">
          <div className="px-4 py-3 border-b border-[#3a3e3a] flex items-center justify-between">
            <h2 className="text-white font-bold text-sm uppercase tracking-wide">League Members</h2>
            <span className="text-gray-500 text-xs">
              {pickCounts.length} / {draftData.members.length} picks in
            </span>
          </div>
          <div>
            {draftData.members.map((member) => {
              const hasPicked = pickCounts.some((pc) => pc.owner === member.name);
              return (
                <div key={member.name} className="flex items-center justify-between px-4 py-2.5 border-b border-white/5 last:border-0">
                  <span className="text-gray-300 text-sm">{member.name}</span>
                  {hasPicked ? (
                    <svg className="w-4 h-4" style={{ color: theme.badgeText }} fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  ) : (
                    <div className="w-4 h-4 rounded-full border border-gray-600" />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </main>
    </>
  );
}
