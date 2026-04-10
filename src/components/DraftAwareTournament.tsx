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
  const [selectedOwner, setSelectedOwner] = useState("");

  const fetchDraft = useCallback(async (owner?: string) => {
    try {
      const ownerParam = owner || selectedOwner;
      const url = ownerParam
        ? `/api/draft/tournament/${config.id}?owner=${encodeURIComponent(ownerParam)}`
        : `/api/draft/tournament/${config.id}`;
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
  }, [config.id, selectedOwner]);

  useEffect(() => {
    fetchDraft();
  }, [fetchDraft]);

  const handleOwnerChange = (owner: string) => {
    setSelectedOwner(owner);
    fetchDraft(owner);
  };

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

  if (draftData.draft.status === "locked" && draftEntries && draftEntries.length > 0) {
    return <Leaderboard config={config} entries={draftEntries} />;
  }

  return (
    <>
      <TournamentHeader
        tournamentName={config.name}
        roundStatus={draftData.draft.status === "open" ? "Draft Open" : "Draft Closed"}
        lastUpdated={null}
        onRefresh={() => {}}
      />
      <DraftPickView
        draftData={draftData}
        config={config}
        selectedOwner={selectedOwner}
        onOwnerChange={handleOwnerChange}
        onPicksSubmitted={() => fetchDraft()}
      />
    </>
  );
}
