"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import { TOURNAMENTS, TournamentId, getTournament } from "@/lib/tournaments";
import { defaultMyTeamMajor, getTournamentState } from "@/lib/tournament-state";
import { fetchTournamentData } from "@/lib/espn";
import { getGolferScore } from "@/lib/scoring";
import { GolferScore } from "@/lib/types";
import { DraftData } from "@/lib/draft/types";
import TeamIdentityCard, { LeagueMember } from "./TeamIdentityCard";
import TeamGolferRow from "./TeamGolferRow";
import {
  LockedBanner,
  FieldPendingBanner,
  FinalBanner,
  LockedRow,
  EmptySlotRow,
} from "./TeamBanners";
import { countingTiers, effectiveScore } from "./teamScoring";
import DraftPickView from "@/components/draft/DraftPickView";

const MAJORS = TOURNAMENTS.filter((t) => t.id !== "season");
const ROMAN = ["I", "II", "III", "IV"];

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
  /** Major with a live draft — selected by default, shows the pick screen. */
  openDraftTournamentId?: TournamentId | null;
  /** Called after picks are submitted so the page can refresh the tab badge. */
  onPicksChanged?: () => void;
}

export interface TeamGolfer {
  tier: number;
  name: string;
  score: GolferScore;
}

export default function MyTeam({
  leagueId,
  myMember,
  onMemberUpdated,
  openDraftTournamentId,
  onPicksChanged,
}: MyTeamProps) {
  const [major, setMajor] = useState<TournamentId>(openDraftTournamentId ?? defaultMyTeamMajor());
  const [golfers, setGolfers] = useState<TeamGolfer[] | null>(null);
  const [draftStatus, setDraftStatus] = useState<string | null>(null);
  const [liveDraft, setLiveDraft] = useState<DraftData | null>(null);
  const [loading, setLoading] = useState(true);

  // The open-draft major arrives async after mount — land on it once known.
  useEffect(() => {
    if (openDraftTournamentId) setMajor(openDraftTournamentId);
  }, [openDraftTournamentId]);

  const loadTeam = useCallback(async () => {
    if (!myMember) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setGolfers(null);
    setDraftStatus(null);
    setLiveDraft(null);
    try {
      const draftRes = await fetch(`/api/draft/tournament/${major}?league_id=${leagueId}`);
      const draftData = await draftRes.json();
      if (!draftData?.draft) {
        setLoading(false);
        return;
      }
      setDraftStatus(draftData.draft.status as string);

      // Live draft → the pick screen takes over this major's slot.
      if (draftData.draft.status === "open") {
        setLiveDraft(draftData as DraftData);
        setLoading(false);
        return;
      }

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

  const config = getTournament(major);
  const majorIndex = MAJORS.findIndex((t) => t.id === major);
  const state = getTournamentState(config);

  return (
    <>
      {/* EVENT HEADER + major switcher */}
      <section className="relative text-center px-6 pt-[46px] pb-10 overflow-hidden border-b border-edge">
        <div
          className="pointer-events-none absolute left-1/2 -top-[30%] -translate-x-1/2 w-[720px] h-[420px]"
          style={{
            background:
              "radial-gradient(ellipse, rgba(201,162,75,0.12), transparent 66%)",
          }}
        />
        <div className="eyebrow relative">
          Major {ROMAN[majorIndex] ?? majorIndex + 1} of IV
        </div>
        <div className="relative flex items-center justify-center gap-3 sm:gap-6 mt-2">
          <button
            onClick={() => majorIndex > 0 && setMajor(MAJORS[majorIndex - 1].id)}
            disabled={majorIndex <= 0}
            aria-label="Previous major"
            className="w-[38px] h-[38px] sm:w-11 sm:h-11 rounded-full border border-edge flex items-center justify-center text-muted hover:border-gold/50 hover:text-gold transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-default shrink-0"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M15 5l-7 7 7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <div className="min-w-0">
            <h1 className="font-serif font-medium text-ink leading-none m-0 text-[clamp(34px,5.5vw,58px)]">
              {config.shortName}
            </h1>
            <div className="mt-[11px] text-[13.5px] tracking-[0.4px] text-muted">
              <EventStatus state={state} venue={config.venue} dates={config.dates} />
            </div>
          </div>
          <button
            onClick={() => majorIndex < MAJORS.length - 1 && setMajor(MAJORS[majorIndex + 1].id)}
            disabled={majorIndex >= MAJORS.length - 1}
            aria-label="Next major"
            className="w-[38px] h-[38px] sm:w-11 sm:h-11 rounded-full border border-edge flex items-center justify-center text-muted hover:border-gold/50 hover:text-gold transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-default shrink-0"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M9 5l7 7-7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
        <div className="relative flex items-center justify-center gap-[9px] mt-5">
          {MAJORS.map((t, i) => (
            <span
              key={t.id}
              className={`rounded-full ${
                i === majorIndex
                  ? "w-2 h-2 bg-gold shadow-[0_0_0_3px_rgba(201,162,75,0.18)]"
                  : i < majorIndex
                    ? "w-[7px] h-[7px] bg-muted"
                    : "w-[7px] h-[7px] bg-edge"
              }`}
            />
          ))}
        </div>
      </section>

      <main className="max-w-[1080px] mx-auto px-6 pb-20 space-y-5">
        <div className="mt-[30px]">
          <TeamIdentityCard leagueId={leagueId} member={myMember} onUpdated={onMemberUpdated} />
        </div>

        {/* Roster */}
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="inline-block w-8 h-8 border-2 border-gold border-t-transparent rounded-full animate-spin" />
          </div>
        ) : !myMember ? (
          <EmptyState
            title="You're not in this league yet"
            body="Join the league (or claim your team from the invite link) to field a team."
          />
        ) : liveDraft ? (
          <DraftPickView
            draftData={liveDraft}
            config={config}
            onPicksSubmitted={() => {
              loadTeam();
              onPicksChanged?.();
            }}
            leagueId={leagueId}
            isMember
          />
        ) : golfers ? (
          <RosterView golfers={golfers} config={config} state={state} />
        ) : draftStatus ? (
          <EmptyState
            title="No team this major"
            body="You didn't field a team for this one. There's always the next major."
          />
        ) : (
          <FieldPendingView config={config} />
        )}
      </main>
    </>
  );
}

/** Sub line under the event title — live/final/tees-off, with venue + dates. */
function EventStatus({
  state,
  venue,
  dates,
}: {
  state: ReturnType<typeof getTournamentState>;
  venue: string;
  dates: string;
}) {
  if (state === "in-progress") {
    return (
      <>
        <span className="inline-flex items-center gap-[7px] text-sage mr-1.5">
          <i className="w-[7px] h-[7px] rounded-full bg-sage shadow-[0_0_0_3px_rgba(156,203,134,0.2)]" />
          Live
        </span>
        · {venue}
      </>
    );
  }
  if (state === "completed") {
    return (
      <>
        <b className="text-gold2 font-medium">Final</b> · {venue} · {dates}
      </>
    );
  }
  return (
    <>
      Tees off {dates} · {venue}
    </>
  );
}

/** Live or final roster — header legend + expandable golfer rows. */
function RosterView({
  golfers,
  config,
  state,
}: {
  golfers: TeamGolfer[];
  config: ReturnType<typeof getTournament>;
  state: ReturnType<typeof getTournamentState>;
}) {
  const counting = countingTiers(golfers);
  const isFinal = state === "completed";
  const isLocked = state === "upcoming";

  // Pre-tournament: roster is set but play hasn't begun — locked, "—" scores.
  if (isLocked) {
    return (
      <div className="space-y-[26px]">
        <LockedBanner />
        <RosterCard title={`${config.shortName} Roster`} legend="Scoring picks · best 5 of 8">
          {golfers.map((g) => (
            <LockedRow key={`${g.tier}-${g.name}`} golfer={g} counting={counting.has(g.tier)} />
          ))}
        </RosterCard>
      </div>
    );
  }

  const total = golfers
    .filter((g) => counting.has(g.tier))
    .reduce((sum, g) => sum + effectiveScore(g.score), 0);

  return (
    <div className="space-y-[26px]">
      {isFinal && <FinalBanner total={total} />}
      <RosterCard
        title={`${config.shortName} Roster${isFinal ? " · Final" : ""}`}
        legend={isFinal ? "Counted toward your score" : "Scoring picks · best 5 of 8"}
      >
        {golfers.map((g) => (
          <TeamGolferRow
            key={`${g.tier}-${g.name}`}
            golfer={g}
            counting={counting.has(g.tier)}
            isFinal={isFinal}
          />
        ))}
      </RosterCard>
    </div>
  );
}

/** Field pending — the draft hasn't opened, eight empty tier slots await. */
function FieldPendingView({ config }: { config: ReturnType<typeof getTournament> }) {
  return (
    <div className="space-y-[26px]">
      <FieldPendingBanner />
      <RosterCard title={`${config.shortName} Roster`} legend="8 tiers · best 5 of 8 count">
        {Array.from({ length: 8 }, (_, i) => (
          <EmptySlotRow key={i} tier={i + 1} />
        ))}
      </RosterCard>
    </div>
  );
}

/** Roster card shell: title + gold-bar legend, then rows. */
function RosterCard({
  title,
  legend,
  children,
}: {
  title: string;
  legend: string;
  children: ReactNode;
}) {
  return (
    <div className="bg-card border border-edge rounded-2xl overflow-hidden">
      <div className="flex items-center justify-between px-6 py-[18px] border-b border-edge">
        <span className="text-xs tracking-[2px] uppercase text-ink font-medium">{title}</span>
        <span className="inline-flex items-center gap-2 text-[11px] tracking-[1.4px] uppercase text-faint">
          <i className="w-[3px] h-3 rounded-[2px] bg-gold inline-block shrink-0" />
          {legend}
        </span>
      </div>
      <div>{children}</div>
    </div>
  );
}

function EmptyState({ title, body }: { title: string; body: string }) {
  return (
    <div className="bg-card rounded-2xl border border-edge px-6 py-14 text-center">
      <h3 className="text-ink font-serif font-medium text-2xl mb-2">{title}</h3>
      <p className="text-muted text-sm">{body}</p>
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
