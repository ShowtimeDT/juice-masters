"use client";

import { Suspense, useState, useEffect, useCallback } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { getTournament, TournamentId } from "@/lib/tournaments";
import { ThemeProvider } from "@/lib/ThemeContext";
import TournamentTabs from "@/components/TournamentTabs";
import Leaderboard from "@/components/Leaderboard";
import DraftAwareTournament from "@/components/DraftAwareTournament";
import SeasonLeaderboard from "@/components/SeasonLeaderboard";

interface LeagueData {
  league: { id: string; name: string; slug: string; commissioner_id: string; invite_code: string };
  members: { user_id: string; display_name: string; email: string }[];
}

function LeagueContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { data: session } = useSession();
  const slug = params.slug as string;

  const [leagueData, setLeagueData] = useState<LeagueData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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
        </div>
      </div>
    );
  }

  const isMember = session?.user?.id && leagueData.members.some((m) => m.user_id === session.user?.id);
  const isCommissioner = session?.user?.id === leagueData.league.commissioner_id;

  return (
    <ThemeProvider value={config.theme}>
      <div className="min-h-screen bg-[#1a1a1a]">
        {/* League header bar */}
        <div className="bg-[#111314] border-b border-[#2a2e2a] px-4 py-2">
          <div className="max-w-5xl mx-auto flex items-center justify-between">
            <span className="text-gray-400 text-xs uppercase tracking-wider">{leagueData.league.name}</span>
            <div className="flex items-center gap-3">
              {isCommissioner && (
                <a href={`/league/${slug}/manage`} className="text-[#C8A951] text-xs hover:text-white transition-colors">
                  Manage
                </a>
              )}
              {session?.user ? (
                <span className="text-gray-500 text-xs">{session.user.name}</span>
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
          <SeasonLeaderboard />
        ) : (
          <DraftAwareTournament
            config={config}
            leagueId={leagueData.league.id}
            isMember={!!isMember}
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
