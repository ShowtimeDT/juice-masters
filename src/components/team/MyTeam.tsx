"use client";

import { useCallback, useEffect, useState } from "react";
import { TOURNAMENTS, TournamentId, getTournament } from "@/lib/tournaments";
import { defaultMyTeamMajor, getTournamentState } from "@/lib/tournament-state";
import { fetchTournamentData } from "@/lib/espn";
import { getGolferScore } from "@/lib/scoring";
import { GolferScore } from "@/lib/types";
import TeamIdentityCard, { LeagueMember } from "./TeamIdentityCard";
import TeamGolferRow from "./TeamGolferRow";

const MAJORS = TOURNAMENTS.filter((t) => t.id !== "season");

interface DraftPick {
  owner: string;
  user_id: string | null;
  tier_number: number;
  golfer_name: string;
}

interface MyTeamProps {
  leagueId: string;
  myMember: LeagueMember | null;
  onMemberUpdated: () => void;
}

export interface TeamGolfer {
  tier: number;
  name: string;
  score: GolferScore;
}

export default function MyTeam({ leagueId, myMember, onMemberUpdated }: MyTeamProps) {
  const [major, setMajor] = useState<TournamentId>(defaultMyTeamMajor());
  const [golfers, setGolfers] = useState<TeamGolfer[] | null>(null);
  const [draftStatus, setDraftStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const loadTeam = useCallback(async () => {
    if (!myMember) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setGolfers(null);
    setDraftStatus(null);
    try {
      const draftRes = await fetch(`/api/draft/tournament/${major}?league_id=${leagueId}`);
      const draftData = await draftRes.json();
      if (!draftData?.draft) {
        setLoading(false);
        return;
      }
      setDraftStatus(draftData.draft.status as string);

      const picks: DraftPick[] = (draftData.picks || []).filter(
        (p: DraftPick) => p.user_id === myMember.user_id || p.owner === myMember.display_name
      );
      if (picks.length === 0) {
        setLoading(false);
        return;
      }

      // Pair each pick with its live/final tournament result.
      const espn = await fetchTournamentData(major).catch(() => null);
      const team = picks
        .sort((a, b) => a.tier_number - b.tier_number)
        .map((p) => ({
          tier: p.tier_number,
          name: p.golfer_name,
          score: espn
            ? getGolferScore(p.golfer_name, espn.golferScores)
            : emptyScore(p.golfer_name),
        }));
      setGolfers(team);
    } catch {
      // leave the empty state
    }
    setLoading(false);
  }, [leagueId, major, myMember]);

  useEffect(() => {
    loadTeam();
  }, [loadTeam]);

  return (
    <main className="max-w-5xl mx-auto px-4 py-8 space-y-6">
      <TeamIdentityCard leagueId={leagueId} member={myMember} onUpdated={onMemberUpdated} />

      {/* Major switcher */}
      <div className="flex flex-wrap gap-2">
        {MAJORS.map((t) => {
          const isActive = t.id === major;
          const upcoming = getTournamentState(t) === "upcoming";
          return (
            <button
              key={t.id}
              onClick={() => setMajor(t.id)}
              className={`px-4 py-2 rounded-lg text-xs font-semibold uppercase tracking-wider transition-colors cursor-pointer border ${
                isActive
                  ? "bg-card text-white border-brand"
                  : `bg-transparent border-edge hover:border-edge-hover ${
                      upcoming ? "text-gray-600" : "text-gray-400"
                    }`
              }`}
            >
              {t.shortName}
            </button>
          );
        })}
      </div>

      {/* Roster */}
      {loading ? (
        <div className="flex justify-center py-16">
          <div className="inline-block w-8 h-8 border-2 border-brand border-t-transparent rounded-full animate-spin" />
        </div>
      ) : !myMember ? (
        <EmptyState
          title="You're not in this league yet"
          body="Join the league (or claim your team from the invite link) to field a team."
        />
      ) : golfers ? (
        <div className="bg-card rounded-lg border border-edge overflow-hidden">
          <div className="px-4 py-3 border-b border-edge flex items-center justify-between">
            <h3 className="text-white font-bold text-sm uppercase tracking-wide">
              {getTournament(major).shortName} Roster
            </h3>
            {draftStatus === "open" && (
              <span className="text-faint text-[10px] uppercase tracking-wider">
                Picks are private until the draft locks
              </span>
            )}
          </div>
          <div>
            {golfers.map((g) => (
              <TeamGolferRow key={`${g.tier}-${g.name}`} golfer={g} />
            ))}
          </div>
        </div>
      ) : draftStatus === "open" ? (
        <EmptyState
          title="You haven't made your picks yet"
          body="The draft is open — head to the Standings tab and hit Draft Now before it locks."
        />
      ) : draftStatus ? (
        <EmptyState
          title={`No team this major`}
          body="You didn't field a team for this one. There's always the next major."
        />
      ) : (
        <EmptyState
          title="No draft for this major yet"
          body="When your commissioner opens the draft, your team will live here."
        />
      )}
    </main>
  );
}

function EmptyState({ title, body }: { title: string; body: string }) {
  return (
    <div className="bg-card rounded-lg border border-edge px-6 py-14 text-center">
      <h3 className="text-white font-serif font-bold text-xl mb-2">{title}</h3>
      <p className="text-gray-400 text-sm">{body}</p>
    </div>
  );
}

function emptyScore(name: string): GolferScore {
  return {
    name,
    espnId: "",
    score: 0,
    scoreDisplay: "-",
    rounds: [],
    birdies: 0,
    missedCut: false,
    position: "-",
    thru: "-",
  };
}
