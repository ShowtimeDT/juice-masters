"use client";

import { useState, useEffect, useCallback } from "react";
import { TournamentConfig } from "@/lib/tournaments";
import { DraftData } from "@/lib/draft/types";
import { Entry } from "@/lib/types";
import TournamentHeader from "./TournamentHeader";
import TournamentPlaceholder from "./TournamentPlaceholder";
import DraftPickView from "./draft/DraftPickView";
import Leaderboard from "./Leaderboard";

interface DraftAwareTournamentProps {
  config: TournamentConfig;
}

export default function DraftAwareTournament({ config }: DraftAwareTournamentProps) {
  const [draftData, setDraftData] = useState<DraftData | null>(null);
  const [draftEntries, setDraftEntries] = useState<Entry[] | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchDraft = useCallback(async () => {
    try {
      const res = await fetch(`/api/draft/tournament/${config.id}`);
      const data = await res.json();

      if (!data || !data.draft) {
        setDraftData(null);
        setDraftEntries(null);
        setLoading(false);
        return;
      }

      setDraftData(data);

      // If draft is locked, fetch entries
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

  // No draft exists — show placeholder
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
  return (
    <>
      <TournamentHeader
        tournamentName={config.name}
        roundStatus={draftData.draft.status === "open" ? "Draft Open" : "Draft Closed"}
        lastUpdated={null}
        onRefresh={() => {}}
      />
      <DraftPickView draftData={draftData} onPicksSubmitted={fetchDraft} />
    </>
  );
}
