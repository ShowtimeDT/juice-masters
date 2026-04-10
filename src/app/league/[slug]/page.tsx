"use client";

import { Suspense, useState, useEffect, useCallback } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { getTournament, TournamentId } from "@/lib/tournaments";
import { ThemeProvider } from "@/lib/ThemeContext";
import TournamentTabs from "@/components/TournamentTabs";
import DraftAwareTournament from "@/components/DraftAwareTournament";
import SeasonLeaderboard from "@/components/SeasonLeaderboard";

interface LeagueInfo {
  id: string;
  name: string;
  slug: string;
  commissioner_id: string;
  invite_code: string;
}

interface LeagueData {
  league: LeagueInfo;
  members: { user_id: string; display_name: string; email: string }[];
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
  const [showLeagueDropdown, setShowLeagueDropdown] = useState(false);

  const activeTab = (searchParams.get("t") || "masters") as TournamentId;
  const config = getTournament(activeTab);

  const fetchLeague = useCallback(async () => {
    try {
      const res = await fetch(`/api/leagues/${slug}`);
      if (!res.ok) {
        setError("League not found");
        setLoading(false);
        return;
      }
      const data = await res.json();
      setLeagueData(data);
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
    router.replace(`/league/${slug}?t=${id}`, { scroll: false });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#1a1a1a] flex items-center justify-center">
        <div className="inline-block w-8 h-8 border-2 border-[#C8A951] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !leagueData) {
    return (
      <div className="min-h-screen bg-[#1a1a1a] flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400 text-sm">{error || "League not found"}</p>
          <a href="/" className="text-[#C8A951] text-sm mt-4 inline-block">Go Home</a>
        </div>
      </div>
    );
  }

  const isCommissioner = session?.user?.id === leagueData.league.commissioner_id;
  const hasMultipleLeagues = myLeagues.length > 1;

  return (
    <ThemeProvider value={config.theme}>
      <div className="min-h-screen bg-[#1a1a1a]">
        {/* League header bar */}
        <div className="bg-[#111314] border-b border-[#2a2e2a] px-4 py-2">
          <div className="max-w-5xl mx-auto flex items-center justify-between">
            {/* LEFT: League name (with switcher) + Manage League */}
            <div className="flex items-center gap-3">
              <div className="relative">
                <button
                  onClick={() => setShowLeagueDropdown(!showLeagueDropdown)}
                  className="text-gray-300 text-xs uppercase tracking-wider font-semibold flex items-center gap-1 cursor-pointer hover:text-white"
                >
                  {leagueData.league.name}
                  <svg className={`w-3 h-3 transition-transform ${showLeagueDropdown ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {/* League dropdown */}
                {showLeagueDropdown && (
                  <div className="absolute top-full left-0 mt-1 bg-[#1e2124] border border-[#3a3e3a] rounded-lg shadow-lg z-50 min-w-[12rem]">
                    {myLeagues.map((league) => (
                      <a
                        key={league.id}
                        href={`/league/${league.slug}`}
                        className={`block px-4 py-2 text-sm transition-colors ${
                          league.slug === slug
                            ? "text-white bg-white/5"
                            : "text-gray-400 hover:text-white hover:bg-white/5"
                        }`}
                        onClick={() => setShowLeagueDropdown(false)}
                      >
                        {league.name}
                      </a>
                    ))}
                    <div className="border-t border-[#3a3e3a]">
                      <a
                        href="/"
                        className="block px-4 py-2 text-xs text-[#C8A951] hover:text-white transition-colors rounded-b-lg"
                        onClick={() => setShowLeagueDropdown(false)}
                      >
                        + Join or Create League
                      </a>
                    </div>
                  </div>
                )}
              </div>

              {isCommissioner && (
                <a
                  href={`/league/${slug}/manage`}
                  className="text-[#C8A951] text-[10px] uppercase tracking-wider hover:text-white transition-colors flex items-center gap-1"
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  Manage League
                </a>
              )}
            </div>

            {/* RIGHT: User name + sign out */}
            <div className="flex items-center gap-3">
              {session?.user ? (
                <>
                  <span className="text-gray-500 text-xs">{session.user.name}</span>
                  <button
                    onClick={() => signOut({ callbackUrl: "/" })}
                    className="text-gray-500 text-xs hover:text-white transition-colors cursor-pointer"
                  >
                    Sign Out
                  </button>
                </>
              ) : (
                <a href={`/login?callbackUrl=/league/${slug}`} className="text-[#C8A951] text-xs hover:text-white transition-colors">
                  Sign In
                </a>
              )}
            </div>
          </div>
        </div>

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
      </div>
    </ThemeProvider>
  );
}

export default function LeaguePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#1a1a1a] flex items-center justify-center">
        <div className="inline-block w-8 h-8 border-2 border-[#C8A951] border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <LeagueContent />
    </Suspense>
  );
}
