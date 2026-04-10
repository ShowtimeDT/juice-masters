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

interface DraftAwareTournamentProps {
  config: TournamentConfig;
  leagueId?: string;
  isMember?: boolean;
}

export default function DraftAwareTournament({ config, leagueId, isMember }: DraftAwareTournamentProps) {
  const { data: session } = useSession();
  const [draftData, setDraftData] = useState<DraftData | null>(null);
  const [draftEntries, setDraftEntries] = useState<Entry[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAuthModal, setShowAuthModal] = useState(false);

  const fetchDraft = useCallback(async () => {
    try {
      const url = `/api/draft/tournament/${config.id}`;
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
  }, [config.id]);

  useEffect(() => {
    fetchDraft();
  }, [fetchDraft]);

  if (loading) {
    return (
      <div>
        <TournamentHeader
          tournamentName={config.name}
          roundStatus={config.dates}
          lastUpdated={null}
          onRefresh={() => {}}
        />
        <div className="flex items-center justify-center py-20">
          <div className="inline-block w-8 h-8 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: config.theme.primary, borderTopColor: 'transparent' }} />
        </div>
      </div>
    );
  }

  if (!draftData) {
    return (
      <>
        <TournamentHeader
          tournamentName={config.name}
          roundStatus={config.dates}
          lastUpdated={null}
          onRefresh={() => {}}
        />
        <TournamentPlaceholder config={config} />
      </>
    );
  }

  // Draft is locked with entries — show leaderboard
  if (draftData.draft.status === "locked" && draftEntries && draftEntries.length > 0) {
    return <Leaderboard config={config} entries={draftEntries} />;
  }

  // Draft is open or closed — show draft pick UI
  const needsAuth = !session?.user && draftData.draft.status === "open";

  return (
    <>
      <TournamentHeader
        tournamentName={config.name}
        roundStatus={draftData.draft.status === "open" ? "Draft Open" : "Draft Closed"}
        lastUpdated={null}
        onRefresh={() => {}}
      />

      {needsAuth && (
        <div className="max-w-5xl mx-auto px-4 pt-6">
          <div className="bg-[#1e2124] rounded-lg border border-[#3a3e3a] p-6 text-center">
            <p className="text-gray-300 text-sm mb-3">Sign in to make your picks</p>
            <button
              onClick={() => setShowAuthModal(true)}
              className="px-6 py-2.5 text-black font-semibold text-sm rounded-lg transition-colors cursor-pointer"
              style={{ backgroundColor: config.theme.accent }}
            >
              Sign In / Create Account
            </button>
          </div>
        </div>
      )}

      {showAuthModal && (
        <AuthModal
          onClose={() => setShowAuthModal(false)}
          onSuccess={() => {
            setShowAuthModal(false);
            fetchDraft();
          }}
        />
      )}

      <DraftPickView
        draftData={draftData}
        config={config}
        onPicksSubmitted={fetchDraft}
        leagueId={leagueId}
        isMember={isMember}
      />
    </>
  );
}
