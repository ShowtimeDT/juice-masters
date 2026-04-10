"use client";

import { Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { getTournament, TournamentId } from "@/lib/tournaments";
import { ThemeProvider } from "@/lib/ThemeContext";
import TournamentTabs from "@/components/TournamentTabs";
import Leaderboard from "@/components/Leaderboard";
import TournamentPlaceholder from "@/components/TournamentPlaceholder";
import TournamentHeader from "@/components/TournamentHeader";
import SeasonLeaderboard from "@/components/SeasonLeaderboard";

function AppContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const activeTab = (searchParams.get("t") || "masters") as TournamentId;
  const config = getTournament(activeTab);

  const handleTabSelect = (id: TournamentId) => {
    router.replace(`/?t=${id}`, { scroll: false });
  };

  if (config.id === "season") {
    return (
      <ThemeProvider value={config.theme}>
        <div className="min-h-screen bg-[#1a1a1a]">
          <TournamentTabs activeId={activeTab} onSelect={handleTabSelect} />
          <SeasonLeaderboard />
        </div>
      </ThemeProvider>
    );
  }

  if (!config.hasEntries) {
    return (
      <ThemeProvider value={config.theme}>
        <div className="min-h-screen bg-[#1a1a1a]">
          <TournamentTabs activeId={activeTab} onSelect={handleTabSelect} />
          <TournamentHeader
            tournamentName={config.name}
            roundStatus={config.dates}
            lastUpdated={null}
            onRefresh={() => {}}
          />
          <TournamentPlaceholder config={config} />
        </div>
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider value={config.theme}>
      <div className="min-h-screen bg-[#1a1a1a]">
        <TournamentTabs activeId={activeTab} onSelect={handleTabSelect} />
        <Leaderboard config={config} />
      </div>
    </ThemeProvider>
  );
}

export default function Home() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#1a1a1a] flex items-center justify-center">
        <div className="inline-block w-8 h-8 border-2 border-[#006747] border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <AppContent />
    </Suspense>
  );
}
