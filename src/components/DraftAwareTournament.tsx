"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { TournamentConfig, TournamentId } from "@/lib/tournaments";
import { DraftData } from "@/lib/draft/types";
import { Entry } from "@/lib/types";
import EventHeader from "./EventHeader";
import TournamentPlaceholder from "./TournamentPlaceholder";
import Leaderboard from "./Leaderboard";
import AuthModal from "./auth/AuthModal";

interface DraftAwareTournamentProps {
  config: TournamentConfig;
  leagueId?: string;
  isMember?: boolean;
  /** Drafting lives in My Team — this jumps the user there. */
  onDraftNow?: () => void;
  onSelectMajor?: (id: TournamentId) => void;
  onSeasonStandings?: () => void;
}

export default function DraftAwareTournament({
  config,
  leagueId,
  isMember,
  onDraftNow,
  onSelectMajor,
  onSeasonStandings,
}: DraftAwareTournamentProps) {
  const { data: session } = useSession();
  const [draftData, setDraftData] = useState<DraftData | null>(null);
  const [draftEntries, setDraftEntries] = useState<Entry[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAuthModal, setShowAuthModal] = useState(false);

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

  const header = (subStatus?: string) => (
    <EventHeader
      config={config}
      subStatus={subStatus}
      onSelectMajor={onSelectMajor}
      onSeasonStandings={onSeasonStandings}
    />
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-surface">
        {header()}
        <div className="flex items-center justify-center py-20">
          <div className="inline-block w-8 h-8 border-2 border-gold border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  // No draft → static entries if they exist (fallback path), else placeholder
  if (!draftData) {
    if (config.hasEntries) {
      return (
        <Leaderboard
          tournamentId={config.id}
          onSelectMajor={onSelectMajor}
          onSeasonStandings={onSeasonStandings}
        />
      );
    }
    return (
      <div className="min-h-screen bg-surface">
        {header()}
        <TournamentPlaceholder config={config} />
      </div>
    );
  }

  // Draft locked with entries → full leaderboard
  if (draftData.draft.status === "locked" && draftEntries && draftEntries.length > 0) {
    return (
      <Leaderboard
        tournamentId={config.id}
        entries={draftEntries}
        onSelectMajor={onSelectMajor}
        onSeasonStandings={onSeasonStandings}
      />
    );
  }

  // Draft is open or closed → show member list + jump-to-My-Team button
  const pickCounts = draftData.pickCounts || [];
  const userHasPicked =
    session?.user?.name && pickCounts.some((pc) => pc.owner === session.user?.name);

  const isOpen = draftData.draft.status === "open";
  const closeTimeStr = draftData.draft.close_time
    ? new Date(draftData.draft.close_time).toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
      })
    : null;

  return (
    <div className="min-h-screen bg-surface">
      {header(isOpen ? "Draft open" : "Draft closed")}

      <main className="max-w-[1080px] mx-auto px-6 py-8 space-y-4">
        {/* Deadline / status banner */}
        {isOpen && closeTimeStr && (
          <div className="rounded-xl px-4 py-3 text-center bg-goldsoft border border-gold/30">
            <p className="text-sm font-medium text-gold2">Draft closes {closeTimeStr}</p>
          </div>
        )}
        {!isOpen && (
          <div className="rounded-xl px-4 py-3 text-sm text-center font-medium bg-goldsoft border border-gold/20 text-gold2">
            Draft is {draftData.draft.status === "locked" ? "locked — picks are final" : "closed"}
          </div>
        )}

        {/* Jump to the My Team tab, where drafting lives */}
        {isOpen && session?.user && isMember && (
          <button
            onClick={onDraftNow}
            className="w-full py-4 btn-gold font-semibold text-sm rounded-xl transition-transform hover:-translate-y-px cursor-pointer"
          >
            {userHasPicked ? "Update Your Picks →" : "Make Your Picks →"}
          </button>
        )}

        {isOpen && !session?.user && (
          <div className="bg-card rounded-2xl border border-edge p-6 text-center">
            <p className="text-text text-sm mb-3">Sign in to make your picks</p>
            <button
              onClick={() => setShowAuthModal(true)}
              className="btn-gold px-6 py-2.5 font-semibold text-sm rounded-xl cursor-pointer"
            >
              Sign In / Create Account
            </button>
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

        {/* Member list with picks-in indicators */}
        <div className="bg-card rounded-2xl border border-edge overflow-hidden">
          <div className="px-5 py-3.5 border-b border-edge flex items-center justify-between">
            <h2 className="text-ink font-medium text-[13px] uppercase tracking-[1.4px]">
              League Members
            </h2>
            <span className="text-faint text-xs">
              {pickCounts.length} / {draftData.members.length} picks in
            </span>
          </div>
          <div>
            {draftData.members.map((member) => {
              const hasPicked = pickCounts.some((pc) => pc.owner === member.name);
              return (
                <div
                  key={member.name}
                  className="flex items-center justify-between px-5 py-2.5 border-t border-line2 first:border-t-0"
                >
                  <span className="text-text text-sm">{member.name}</span>
                  {hasPicked ? (
                    <svg className="w-4 h-4 text-sage" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  ) : (
                    <div className="w-4 h-4 rounded-full border border-faint" />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </main>
    </div>
  );
}
