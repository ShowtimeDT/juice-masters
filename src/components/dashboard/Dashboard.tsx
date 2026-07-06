"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useAutoRefresh } from "@/hooks/useAutoRefresh";
import { calculateStandings } from "@/lib/scoring";
import { EntryStanding, GolferScoreWithCounting } from "@/lib/types";
import { TournamentId, getTournament } from "@/lib/tournaments";
import { formatScore, scoreColor } from "@/lib/format";
import Headshot from "@/components/ui/Headshot";
import {
  DashboardPhase,
  derivePhase,
  focusMajorId,
  getLiveMajor,
  getLastCompletedMajor,
  getNextUpcomingMajor,
  daysUntilMajor,
  formatCountdown,
  ordinal,
} from "@/lib/dashboard";

interface MyLeague {
  id: string;
  name: string;
  slug: string;
  is_commissioner: boolean;
}

interface DraftRow {
  id: string;
  tournament_id: string;
  status: string;
  league_id: string;
  close_time: string | null;
}

interface DraftStatus {
  leagueId: string;
  slug: string;
  name: string;
  tournamentId: TournamentId;
  picked: boolean;
  total: number;
  closeISO: string | null;
}

/** "The Masters" / "The Open" — never "The The Open" (some names own their "The"). */
const theMajor = (name: string) => (/^the\s/i.test(name) ? name : `The ${name}`);
/** Mid-sentence article: "at the Masters" but "at The Open". */
const atMajor = (name: string) => (/^the\s/i.test(name) ? `at ${name}` : `at the ${name}`);

const monogram = (name: string) =>
  name
    .trim()
    .split(/\s+/)
    .map((w) => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();

/** Counting picks first (gold-bar), then bench — both by effective score. */
function rosterOrder(golfers: GolferScoreWithCounting[]): GolferScoreWithCounting[] {
  return [...golfers].sort((a, b) => {
    if (a.isCounting !== b.isCounting) return a.isCounting ? -1 : 1;
    return a.effectiveScore - b.effectiveScore;
  });
}

function LeagueMark({ text, size = 38 }: { text: string; size?: number }) {
  return (
    <span
      className="rounded-[11px] bg-goldsoft text-gold2 flex items-center justify-center font-serif font-semibold shrink-0"
      style={{ width: size, height: size, fontSize: Math.round(size * 0.42) }}
    >
      {text}
    </span>
  );
}

function SectionLabel({ children, live }: { children: React.ReactNode; live?: boolean }) {
  return (
    <div className="font-sans font-semibold text-[11px] tracking-[1.8px] uppercase text-faint mb-3.5 flex items-center gap-2">
      {live && (
        <span className="inline-flex items-center gap-1.5 text-sage">
          <i className="w-[5px] h-[5px] rounded-full bg-sage shadow-[0_0_0_3px_rgba(156,203,134,0.2)]" />
        </span>
      )}
      {children}
    </div>
  );
}

export default function Dashboard() {
  const { data: session } = useSession();
  const myName = session?.user?.name ?? null;

  const [leagues, setLeagues] = useState<MyLeague[]>([]);
  const [drafts, setDrafts] = useState<DraftRow[]>([]);
  const [standingsByLeague, setStandingsByLeague] = useState<Record<string, EntryStanding[]>>({});
  const [draftStatuses, setDraftStatuses] = useState<DraftStatus[]>([]);
  const [selectedLeagueId, setSelectedLeagueId] = useState<string | null>(null);

  // Meta: the user's leagues + the drafts across them.
  useEffect(() => {
    if (!session?.user) return;
    Promise.all([
      fetch("/api/leagues/my").then((r) => (r.ok ? r.json() : [])),
      fetch("/api/draft/list").then((r) => (r.ok ? r.json() : [])),
    ])
      .then(([lg, df]) => {
        if (Array.isArray(lg)) setLeagues(lg);
        if (Array.isArray(df)) setDrafts(df);
      })
      .catch(() => {});
  }, [session?.user]);

  const hasOpenDraft = drafts.some((d) => d.status === "open");
  const phase: DashboardPhase = derivePhase(hasOpenDraft);
  const focusId = focusMajorId(phase);
  const focusMajor = getTournament(focusId);

  // Live scores for the focus major (live phase = the live board; off = last major's final).
  const { data: espnData } = useAutoRefresh(focusId);

  // Default the live-phase league picker to the first league.
  useEffect(() => {
    if (!selectedLeagueId && leagues.length) setSelectedLeagueId(leagues[0].id);
  }, [leagues, selectedLeagueId]);

  // Standings per league for the focus major (live/off) — one ESPN dataset, one
  // entries fetch per league, scored by the existing engine.
  useEffect(() => {
    if (phase === "draft" || !espnData || leagues.length === 0) return;
    let cancelled = false;
    (async () => {
      const map: Record<string, EntryStanding[]> = {};
      await Promise.all(
        leagues.map(async (lg) => {
          const draft = drafts.find(
            (d) => d.league_id === lg.id && d.tournament_id === focusId && d.status === "locked"
          );
          if (!draft) return;
          try {
            const res = await fetch(`/api/draft/${draft.id}/entries`);
            if (!res.ok) return;
            const entries = await res.json();
            if (Array.isArray(entries) && entries.length) {
              map[lg.id] = calculateStandings(entries, espnData);
            }
          } catch {
            // skip this league
          }
        })
      );
      if (!cancelled) setStandingsByLeague(map);
    })();
    return () => {
      cancelled = true;
    };
  }, [phase, espnData, leagues, drafts, focusId]);

  // Draft pick status per open draft (draft phase).
  useEffect(() => {
    if (phase !== "draft") return;
    let cancelled = false;
    (async () => {
      const open = drafts.filter((d) => d.status === "open");
      const results = await Promise.all(
        open.map(async (d) => {
          const lg = leagues.find((l) => l.id === d.league_id);
          if (!lg) return null;
          try {
            const res = await fetch(`/api/draft/tournament/${d.tournament_id}?league_id=${d.league_id}`);
            const data = await res.json();
            const picked = (data?.pickCounts || []).some(
              (pc: { owner: string }) => pc.owner === myName
            );
            return {
              leagueId: lg.id,
              slug: lg.slug,
              name: lg.name,
              tournamentId: d.tournament_id as TournamentId,
              picked,
              total: (data?.members || []).length,
              closeISO: data?.draft?.close_time ?? d.close_time ?? null,
            } as DraftStatus;
          } catch {
            return null;
          }
        })
      );
      if (!cancelled) setDraftStatuses(results.filter(Boolean) as DraftStatus[]);
    })();
    return () => {
      cancelled = true;
    };
  }, [phase, drafts, leagues, myName]);

  // Per-league derived view (live/off).
  const leagueViews = useMemo(
    () =>
      leagues.map((lg) => {
        const standings = standingsByLeague[lg.id];
        const mine = standings?.find((s) => s.entry.owner === myName) ?? null;
        return { league: lg, standings: standings ?? null, mine, members: standings?.length ?? null };
      }),
    [leagues, standingsByLeague, myName]
  );

  const selected = leagueViews.find((v) => v.league.id === selectedLeagueId) ?? leagueViews[0] ?? null;

  if (!session?.user) {
    return (
      <div className="min-h-[40vh] flex items-center justify-center text-muted text-sm">
        Sign in to see your dashboard.
      </div>
    );
  }

  const greeting = myName ? myName.split(" ")[0] : "there";

  return (
    <main className="px-6 pb-20">
      <div className="max-w-[1180px] mx-auto pt-9">
        <h1 className="font-serif font-medium text-[30px] text-ink leading-[1.05]">
          Welcome back, {greeting}.
        </h1>
        <p className="text-[13px] text-muted mt-1.5">
          {phase === "live"
            ? "A major is live — here's where you stand."
            : phase === "draft"
              ? "Draft week. Lock in your teams."
              : "The off-season brief."}
        </p>
      </div>

      <div
        className={`mx-auto mt-6 flex flex-col gap-3.5 ${
          phase === "live" ? "max-w-[960px]" : "max-w-[560px]"
        }`}
      >
        {phase === "off" && <OffView leagueViews={leagueViews} primary={selected} />}
        {phase === "draft" && <DraftView statuses={draftStatuses} leagueViews={leagueViews} />}
        {phase === "live" && (
          <LiveView
            leagueViews={leagueViews}
            selected={selected}
            selectedLeagueId={selectedLeagueId}
            onSelectLeague={setSelectedLeagueId}
            myName={myName}
            majorName={(getLiveMajor() ?? focusMajor).shortName}
            roundStatus={espnData?.roundStatus ?? ""}
          />
        )}
      </div>
    </main>
  );
}

/* ------------------------------- OFF-SEASON ------------------------------- */

function OffView({
  leagueViews,
  primary,
}: {
  leagueViews: LeagueView[];
  primary: LeagueView | null;
}) {
  const next = getNextUpcomingMajor();
  const last = getLastCompletedMajor();
  const days = next ? daysUntilMajor(next) : null;

  return (
    <>
      {/* Hero */}
      <div className="rounded-2xl border border-gold/30 bg-[linear-gradient(160deg,rgba(201,162,75,0.09),transparent_60%),var(--surface)] p-5 flex items-center gap-[18px]">
        <span className="w-[50px] h-[50px] rounded-[13px] btn-gold flex items-center justify-center shrink-0">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <rect x="3" y="5" width="18" height="16" rx="2" stroke="currentColor" strokeWidth="1.8" />
            <path d="M3 9h18M8 3v4M16 3v4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
        </span>
        <div className="flex-1 min-w-0">
          <b className="font-serif font-medium text-[22px] text-ink block leading-tight">
            {next ? `${theMajor(next.shortName)} is up next` : "The season is complete"}
          </b>
          <span className="text-[13px] text-muted block mt-1">
            {next
              ? `Field announced before the tournament · ${days} day${days === 1 ? "" : "s"} away.`
              : "See you next season."}
          </span>
        </div>
        <Link
          href="/settings"
          className="inline-flex items-center h-[46px] px-[18px] rounded-xl border border-edge text-text text-[13.5px] font-semibold hover:border-gold/50 hover:text-gold2 transition-colors shrink-0"
        >
          Set a reminder
        </Link>
      </div>

      <YourLeaguesCard phase="off" leagueViews={leagueViews} />

      {/* Recap */}
      {last && (
        <div className="rounded-2xl border border-edge bg-card p-5">
          <SectionLabel>Last major · recap</SectionLabel>
          <div className="flex items-center gap-3.5">
            <span className="w-[42px] h-[42px] rounded-[11px] bg-goldsoft text-gold2 flex items-center justify-center shrink-0">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M7 4h10v4a5 5 0 0 1-10 0V4Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
              </svg>
            </span>
            <div className="flex-1 min-w-0">
              <div className="font-serif text-[18px] text-ink">
                {primary?.mine
                  ? `You finished ${ordinal(primary.mine.rank)} ${atMajor(last.shortName)}`
                  : `${theMajor(last.shortName)} has wrapped`}
              </div>
              <div className="text-[12.5px] text-faint">
                {primary?.mine
                  ? `${primary.league.name} · closed ${formatScore(primary.mine.countingScore)}`
                  : "Final results are in your leagues."}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

/* -------------------------------- DRAFT WEEK ------------------------------- */

function DraftView({
  statuses,
  leagueViews,
}: {
  statuses: DraftStatus[];
  leagueViews: LeagueView[];
}) {
  const needsYou = statuses.filter((s) => !s.picked);
  const soonest = [...statuses]
    .filter((s) => s.closeISO)
    .sort((a, b) => new Date(a.closeISO as string).getTime() - new Date(b.closeISO as string).getTime())[0];
  const countdown = soonest ? formatCountdown(soonest.closeISO) : null;
  const draftHref = soonest ? `/league/${soonest.slug}?v=team` : "/home";

  return (
    <>
      <div className="rounded-2xl border border-gold/30 bg-[linear-gradient(160deg,rgba(201,162,75,0.09),transparent_60%),var(--surface)] p-5 flex items-center gap-[18px]">
        <span className="w-[50px] h-[50px] rounded-[13px] btn-gold flex items-center justify-center shrink-0">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M7 4v16M7 4.5 18 7l-11 2.5" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
            <ellipse cx="12" cy="20" rx="7" ry="2" stroke="currentColor" strokeWidth="1.8" />
          </svg>
        </span>
        <div className="flex-1 min-w-0">
          <b className="font-serif font-medium text-[22px] text-ink block leading-tight">
            {needsYou.length > 0
              ? `${needsYou.length} draft${needsYou.length === 1 ? "" : "s"} need you`
              : "Your picks are in"}
          </b>
          <span className="text-[13px] text-muted block mt-1">
            {soonest ? (
              <>
                {soonest.name} closes in <span className="font-mono text-gold2 text-[15px]">{countdown ?? "soon"}</span>
                {soonest.picked ? " · you're locked in" : " · not yet picked"}
              </>
            ) : (
              "Drafts are open in your leagues."
            )}
          </span>
        </div>
        <Link
          href={draftHref}
          className="btn-gold inline-flex items-center h-[46px] px-[18px] rounded-xl text-[13.5px] font-semibold hover:-translate-y-px transition-transform shrink-0"
        >
          Draft now →
        </Link>
      </div>

      <YourLeaguesCard phase="draft" leagueViews={leagueViews} draftStatuses={statuses} />

      <div className="rounded-2xl border border-edge bg-card p-5">
        <SectionLabel>This week</SectionLabel>
        <div className="text-[13.5px] text-text leading-[1.6]">
          The field is set. Draft your 8 golfers before the tournament tees off — favorites are
          safe, but sleepers win leagues.
        </div>
      </div>
    </>
  );
}

/* -------------------------------- LIVE MAJOR ------------------------------ */

function LiveView({
  leagueViews,
  selected,
  selectedLeagueId,
  onSelectLeague,
  myName,
  majorName,
  roundStatus,
}: {
  leagueViews: LeagueView[];
  selected: LeagueView | null;
  selectedLeagueId: string | null;
  onSelectLeague: (id: string) => void;
  myName: string | null;
  majorName: string;
  roundStatus: string;
}) {
  const ranked = leagueViews.filter((v) => v.mine);
  const top3 = ranked.filter((v) => (v.mine as EntryStanding).rank <= 3).length;
  const best = ranked.slice().sort((a, b) => (a.mine as EntryStanding).rank - (b.mine as EntryStanding).rank)[0];
  const liveHref = selected ? `/league/${selected.league.slug}?v=standings` : "/home";

  return (
    <>
      {/* Hero (full width) */}
      <div className="rounded-2xl border border-gold/30 bg-[linear-gradient(160deg,rgba(201,162,75,0.09),transparent_60%),var(--surface)] p-5">
        <SectionLabel live>
          {majorName} · Live{roundStatus ? ` · ${roundStatus}` : ""}
        </SectionLabel>
        <div className="flex items-end justify-between gap-4 flex-wrap">
          <div>
            <div className="font-serif font-medium text-[24px] text-ink leading-tight">
              {ranked.length
                ? `You're top-3 in ${top3} of ${ranked.length} league${ranked.length === 1 ? "" : "s"}`
                : "Your majors, all in one place"}
            </div>
            {best?.mine && (
              <div className="text-[13px] text-muted mt-1.5">
                Best league: {best.league.name} ·{" "}
                <span className={`font-semibold ${scoreColor((best.mine as EntryStanding).countingScore)}`}>
                  {ordinal((best.mine as EntryStanding).rank)} at {formatScore((best.mine as EntryStanding).countingScore)}
                </span>
              </div>
            )}
          </div>
          <Link
            href={liveHref}
            className="btn-gold inline-flex items-center h-[46px] px-[18px] rounded-xl text-[13.5px] font-semibold hover:-translate-y-px transition-transform"
          >
            Open live standings →
          </Link>
        </div>
      </div>

      {/* League picker (full width) */}
      {leagueViews.length > 1 && (
        <div className="flex w-full bg-bg border border-edge rounded-[11px] p-1 gap-1">
          {leagueViews.map((v) => {
            const on = v.league.id === selectedLeagueId;
            return (
              <button
                key={v.league.id}
                onClick={() => onSelectLeague(v.league.id)}
                className={`flex-1 text-[13px] font-medium rounded-lg px-3 py-2 transition-colors truncate ${
                  on
                    ? "bg-goldsoft text-gold2 shadow-[inset_0_0_0_1px_rgba(201,162,75,0.4)]"
                    : "text-muted hover:text-ink"
                }`}
              >
                {monogram(v.league.name)} · {v.league.name.split(" ")[0]}
              </button>
            );
          })}
        </div>
      )}

      {/* Masonry: team + quick standings + leagues */}
      <div className="[column-count:1] md:[column-count:2] [column-gap:14px]">
        <div className="[break-inside:avoid] mb-3.5">
          <YourTeamCard selected={selected} />
        </div>
        <div className="[break-inside:avoid] mb-3.5">
          <QuickStandingsCard selected={selected} myName={myName} />
        </div>
        <div className="[break-inside:avoid] mb-3.5">
          <YourLeaguesCard phase="live" leagueViews={leagueViews} />
        </div>
      </div>
    </>
  );
}

function YourTeamCard({ selected }: { selected: LeagueView | null }) {
  if (!selected?.mine) {
    return (
      <div className="rounded-2xl border border-edge bg-card p-5">
        <SectionLabel live>Your team</SectionLabel>
        <p className="text-[13px] text-faint">No locked roster in this league yet.</p>
      </div>
    );
  }
  const roster = rosterOrder(selected.mine.golferScores);
  return (
    <div className="rounded-2xl border border-edge bg-card p-5">
      <div className="flex items-center justify-between mb-3.5">
        <SectionLabel live>Your team · {selected.league.name}</SectionLabel>
        <span className="text-[11px] text-faint flex items-center gap-1.5">
          <i className="inline-block w-[3px] h-[10px] bg-gold rounded-[2px]" />
          best 5 of 8
        </span>
      </div>
      {roster.map((g) => {
        const notPlayed = g.scoreDisplay === "-";
        return (
          <div
            key={`${g.name}-${g.tier}`}
            className="relative flex items-center gap-2.5 py-2 border-t border-line2 first:border-t-0"
            style={{ paddingLeft: g.isCounting ? 10 : 0 }}
          >
            {g.isCounting && (
              <span className="absolute left-0 top-[9px] bottom-[9px] w-[3px] bg-gold rounded-r-[2px]" />
            )}
            <Headshot name={g.name} espnId={g.espnId} size={30} missedCut={g.missedCut} />
            <span className={`flex-1 min-w-0 text-[13px] truncate ${g.isCounting ? "text-text" : "text-muted"}`}>
              {g.name}
            </span>
            <span className="text-[10px] text-faint">{g.thru === "F" ? "F" : `thru ${g.thru}`}</span>
            <span className={`w-[34px] text-right text-[13px] font-semibold tnum ${scoreColor(g.effectiveScore)}`}>
              {notPlayed ? "–" : formatScore(g.effectiveScore)}
            </span>
          </div>
        );
      })}
      <div className="flex items-center justify-between border-t border-edge mt-1.5 pt-3">
        <span className="text-[12px] tracking-[1.4px] uppercase text-faint">Counting total</span>
        <span className={`font-serif font-medium text-[26px] ${scoreColor(selected.mine.countingScore)}`}>
          {formatScore(selected.mine.countingScore)}
        </span>
      </div>
    </div>
  );
}

function QuickStandingsCard({ selected, myName }: { selected: LeagueView | null; myName: string | null }) {
  if (!selected?.standings?.length) {
    return (
      <div className="rounded-2xl border border-edge bg-card p-5">
        <SectionLabel>Quick standings</SectionLabel>
        <p className="text-[13px] text-faint">Standings appear once play begins.</p>
      </div>
    );
  }
  const top = selected.standings.slice(0, 4);
  return (
    <div className="rounded-2xl border border-edge bg-card p-5">
      <SectionLabel>Quick standings · {selected.league.name}</SectionLabel>
      {top.map((s, i) => {
        const you = s.entry.owner === myName;
        return (
          <div
            key={s.entry.id}
            className={`flex items-center gap-2.5 py-2 ${i ? "border-t border-line2" : ""}`}
          >
            <span className={`font-serif italic text-sm w-5 ${you ? "text-gold" : "text-faint"}`}>{s.rank}</span>
            <span className={`flex-1 min-w-0 text-[13px] truncate ${you ? "text-gold2 font-medium" : "text-text"}`}>
              {s.entry.name}
              {you ? " · you" : ""}
            </span>
            <span className={`text-[13px] font-semibold tnum ${scoreColor(s.countingScore)}`}>
              {formatScore(s.countingScore)}
            </span>
          </div>
        );
      })}
      <Link
        href={`/league/${selected.league.slug}?v=standings`}
        className="flex items-center justify-center w-full h-[42px] mt-3 rounded-xl border border-edge text-text text-[13px] font-semibold hover:border-gold/50 hover:text-gold2 transition-colors"
      >
        Full standings →
      </Link>
    </div>
  );
}

function YourLeaguesCard({
  phase,
  leagueViews,
  draftStatuses,
}: {
  phase: DashboardPhase;
  leagueViews: LeagueView[];
  draftStatuses?: DraftStatus[];
}) {
  return (
    <div className="rounded-2xl border border-edge bg-card p-5">
      <SectionLabel>Your leagues</SectionLabel>
      {leagueViews.map((v) => {
        const lead = v.mine?.rank === 1;
        let right: React.ReactNode = null;
        if (phase === "off") {
          right = (
            <div className="text-right shrink-0">
              <b className="font-serif text-[19px] text-ink">
                {v.mine ? ordinal(v.mine.rank) : "—"}
              </b>
              <span className="block text-[9.5px] tracking-[0.6px] uppercase text-faint">last major</span>
            </div>
          );
        } else if (phase === "draft") {
          const st = draftStatuses?.find((d) => d.leagueId === v.league.id);
          right = (
            <div className="text-right shrink-0">
              <b className="text-[13px] text-gold2 font-semibold">
                {st ? (st.picked ? "8/8" : "0/8") : "—"}
              </b>
              <span className="block text-[9.5px] tracking-[0.6px] uppercase text-faint">picks</span>
            </div>
          );
        } else {
          right = (
            <div className="text-right shrink-0">
              <b className={`font-serif text-[19px] ${lead ? "text-gold2" : "text-ink"}`}>
                {v.mine ? formatScore(v.mine.countingScore) : "—"}
              </b>
              <span className="block text-[9.5px] tracking-[0.6px] uppercase text-faint">
                {v.mine ? ordinal(v.mine.rank) : "live"}
              </span>
            </div>
          );
        }
        return (
          <Link
            key={v.league.id}
            href={`/league/${v.league.slug}?v=standings`}
            className="flex items-center gap-3.5 py-3 border-t border-line2 first:border-t-0"
          >
            <LeagueMark text={monogram(v.league.name)} />
            <div className="flex-1 min-w-0">
              <b className="font-serif font-medium text-[17px] text-ink block leading-tight truncate">
                {v.league.name}
              </b>
              <span className="text-[11.5px] text-faint">
                {v.members != null ? `${v.members} members` : v.league.is_commissioner ? "Commissioner" : "Member"}
                {phase === "live" ? " · live" : ""}
              </span>
            </div>
            {right}
            <svg className="text-faint shrink-0" width="17" height="17" viewBox="0 0 24 24" fill="none">
              <path d="M9 5l7 7-7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Link>
        );
      })}
      {leagueViews.length === 0 && (
        <p className="text-[13px] text-faint py-2">
          You&apos;re not in a league yet.{" "}
          <Link href="/?home=1" className="text-gold2">
            Join or create one →
          </Link>
        </p>
      )}
    </div>
  );
}

/* Shared row-view type for the panels. */
interface LeagueView {
  league: MyLeague;
  standings: EntryStanding[] | null;
  mine: EntryStanding | null;
  members: number | null;
}
