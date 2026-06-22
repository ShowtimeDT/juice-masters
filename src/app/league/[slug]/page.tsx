"use client";

import { Suspense, useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { getTournament, isTournamentId, TournamentId } from "@/lib/tournaments";
import AppTabs, { AppView, isAppView } from "@/components/AppTabs";
import LeagueSwitcher from "@/components/LeagueSwitcher";
import AccountMenu from "@/components/AccountMenu";
import NotificationBell from "@/components/ui/NotificationBell";
import MyTeam from "@/components/team/MyTeam";
import LeagueChat from "@/components/chat/LeagueChat";
import { defaultTournamentTab, defaultMyTeamMajor } from "@/lib/tournament-state";
import DraftAwareTournament from "@/components/DraftAwareTournament";
import SeasonLeaderboard from "@/components/SeasonLeaderboard";

interface LeagueInfo {
  id: string;
  name: string;
  slug: string;
  commissioner_id: string;
  invite_code: string;
  is_private?: boolean;
}

interface LeagueData {
  league: LeagueInfo;
  members: {
    id: number;
    user_id: string | null;
    display_name: string;
    team_name: string | null;
    team_photo: string | null;
  }[];
}

interface MyLeague {
  id: string;
  name: string;
  slug: string;
  is_commissioner: boolean;
}

interface OpenDraftInfo {
  tournamentId: TournamentId;
  hasPicked: boolean;
}

function LeagueContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { data: session } = useSession();
  const slug = params.slug as string;

  const [leagueData, setLeagueData] = useState<LeagueData | null>(null);
  const [myLeagues, setMyLeagues] = useState<MyLeague[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [openDraft, setOpenDraft] = useState<OpenDraftInfo | null>(null);

  const tabParam = searchParams.get("t");
  const activeTab: TournamentId = isTournamentId(tabParam) ? tabParam : defaultTournamentTab();
  const config = getTournament(activeTab);
  const viewParam = searchParams.get("v");
  const activeView: AppView = isAppView(viewParam) ? viewParam : "standings";

  const fetchLeague = useCallback(async () => {
    try {
      const res = await fetch(`/api/leagues/${slug}`);
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.private ? "private" : "League not found");
        setLoading(false);
        return;
      }
      const data = await res.json();
      setLeagueData(data);
      try {
        localStorage.setItem("lastLeagueSlug", slug);
      } catch {
        // private browsing — fine
      }
    } catch {
      setError("Failed to load league");
    }
    setLoading(false);
  }, [slug]);

  // Fetch user's leagues for the switcher
  useEffect(() => {
    if (session?.user) {
      fetch("/api/leagues/my")
        .then((r) => r.json())
        .then((data) => { if (Array.isArray(data)) setMyLeagues(data); })
        .catch(() => {});
    }
  }, [session?.user]);

  useEffect(() => {
    fetchLeague();
  }, [fetchLeague]);

  // Is a draft live in this league, and has this member picked yet?
  // Drives the My Team tab badge and the default major on that tab.
  const myMember = leagueData?.members.find((m) => m.user_id === session?.user?.id) ?? null;
  const myDisplayName = myMember?.display_name ?? null;
  const leagueDbId = leagueData?.league.id ?? null;

  const fetchOpenDraft = useCallback(async () => {
    if (!myDisplayName || !leagueDbId) {
      setOpenDraft(null);
      return;
    }
    try {
      const listRes = await fetch("/api/draft/list");
      if (!listRes.ok) return;
      const drafts: { league_id: string; tournament_id: string; status: string }[] =
        await listRes.json();
      const open = drafts.find((d) => d.league_id === leagueDbId && d.status === "open");
      if (!open || !isTournamentId(open.tournament_id)) {
        setOpenDraft(null);
        return;
      }
      // The tournament endpoint auto-locks expired drafts and counts picks.
      const res = await fetch(`/api/draft/tournament/${open.tournament_id}?league_id=${leagueDbId}`);
      const data = await res.json();
      if (data?.draft?.status !== "open") {
        setOpenDraft(null);
        return;
      }
      const hasPicked = (data.pickCounts || []).some(
        (pc: { owner: string }) => pc.owner === myDisplayName
      );
      setOpenDraft({ tournamentId: open.tournament_id, hasPicked });
    } catch {
      // no badge — next visit retries
    }
  }, [myDisplayName, leagueDbId]);

  useEffect(() => {
    fetchOpenDraft();
  }, [fetchOpenDraft]);

  const handleTabSelect = (id: TournamentId) => {
    router.replace(`/league/${slug}?v=${activeView}&t=${id}`, { scroll: false });
  };

  const handleViewSelect = (view: AppView) => {
    router.replace(`/league/${slug}?v=${view}`, { scroll: false });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <div className="inline-block w-8 h-8 border-2 border-brand border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error === "private") {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <div className="bg-card rounded-lg border border-edge px-8 py-12 text-center max-w-sm mx-4">
          <h2 className="text-white font-serif font-bold text-2xl mb-2">This league is private</h2>
          <p className="text-gray-400 text-sm mb-6">
            You need an invite link from a member, or the league password, to get in.
          </p>
          {!session?.user && (
            <Link
              href={`/login?callbackUrl=/league/${slug}`}
              className="inline-block px-6 py-2.5 bg-brand text-black font-semibold text-sm rounded-lg hover:bg-brand-hover transition-colors"
            >
              Sign In
            </Link>
          )}
        </div>
      </div>
    );
  }

  if (error || !leagueData) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400 text-sm">{error || "League not found"}</p>
          <Link href="/" className="text-brand text-sm mt-4 inline-block">Go Home</Link>
        </div>
      </div>
    );
  }

  const isCommissioner = session?.user?.id === leagueData.league.commissioner_id;

  return (
    <div className="min-h-screen bg-surface">
        <AppTabs
          active={activeView}
          onSelect={handleViewSelect}
          teamBadge={!!openDraft && !openDraft.hasPicked}
        >
          <LeagueSwitcher
            currentName={leagueData.league.name}
            currentSlug={slug}
            leagues={myLeagues}
            manageHref={isCommissioner ? `/league/${slug}/manage` : null}
          />
          <NotificationBell />
          <AccountMenu loginCallbackUrl={`/league/${slug}`} />
        </AppTabs>

        {activeView === "standings" &&
          (config.id === "season" ? (
            <div className="min-h-screen bg-surface">
              <div className="max-w-[1080px] mx-auto px-6 pt-6">
                <button
                  onClick={() => handleTabSelect(defaultMyTeamMajor())}
                  className="inline-flex items-center gap-2 text-sm text-gold2 hover:text-ink transition-colors"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <path d="M15 5l-7 7 7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  Back to {getTournament(defaultMyTeamMajor()).shortName}
                </button>
              </div>
              <SeasonLeaderboard leagueId={leagueData.league.id} />
            </div>
          ) : (
            <DraftAwareTournament
              config={config}
              leagueId={leagueData.league.id}
              isMember={!!myMember}
              onDraftNow={() => handleViewSelect("team")}
              onSelectMajor={handleTabSelect}
              onSeasonStandings={() => handleTabSelect("season")}
            />
          ))}

        {activeView === "team" && (
          <MyTeam
            leagueId={leagueData.league.id}
            myMember={myMember}
            onMemberUpdated={fetchLeague}
            openDraftTournamentId={openDraft?.tournamentId ?? null}
            onPicksChanged={fetchOpenDraft}
          />
        )}

        {activeView === "chat" && (
          <LeagueChat leagueId={leagueData.league.id} isMember={!!myMember} />
        )}
    </div>
  );
}

export default function LeaguePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <div className="inline-block w-8 h-8 border-2 border-brand border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <LeagueContent />
    </Suspense>
  );
}
