"use client";

import { Suspense, useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { getTournament, isTournamentId, TournamentId } from "@/lib/tournaments";
import TournamentTabs from "@/components/TournamentTabs";
import AppTabs, { AppView, isAppView } from "@/components/AppTabs";
import LeagueSwitcher from "@/components/LeagueSwitcher";
import AccountMenu from "@/components/AccountMenu";
import MyTeam from "@/components/team/MyTeam";
import LeagueChat from "@/components/chat/LeagueChat";
import { defaultTournamentTab } from "@/lib/tournament-state";
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
        <AppTabs active={activeView} onSelect={handleViewSelect}>
          <LeagueSwitcher
            currentName={leagueData.league.name}
            currentSlug={slug}
            leagues={myLeagues}
            manageHref={isCommissioner ? `/league/${slug}/manage` : null}
          />
          <AccountMenu loginCallbackUrl={`/league/${slug}`} />
        </AppTabs>

        {activeView === "standings" && (
          <>
            <TournamentTabs activeId={activeTab} onSelect={handleTabSelect} />

            {config.id === "season" ? (
              <SeasonLeaderboard leagueId={leagueData.league.id} />
            ) : (
              <DraftAwareTournament
                config={config}
                leagueId={leagueData.league.id}
                isMember={!!leagueData.members.some((m) => m.user_id === session?.user?.id)}
              />
            )}
          </>
        )}

        {activeView === "team" && (
          <MyTeam
            leagueId={leagueData.league.id}
            myMember={
              leagueData.members.find((m) => m.user_id === session?.user?.id) ?? null
            }
            onMemberUpdated={fetchLeague}
          />
        )}

        {activeView === "chat" && (
          <LeagueChat
            leagueId={leagueData.league.id}
            isMember={!!leagueData.members.some((m) => m.user_id === session?.user?.id)}
          />
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
