"use client";

import { useState } from "react";
import { TournamentId } from "@/lib/tournaments";
import Leaderboard from "./Leaderboard";
import TournamentTabs from "./TournamentTabs";

export default function LeaderboardPage() {
  const [activeId, setActiveId] = useState<TournamentId>("pga");

  return (
    <>
      <TournamentTabs activeId={activeId} onSelect={setActiveId} />
      <Leaderboard key={activeId} tournamentId={activeId} />
    </>
  );
}
