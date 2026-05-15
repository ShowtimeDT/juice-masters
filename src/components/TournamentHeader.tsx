"use client";

import Image from "next/image";
import { TournamentConfig } from "@/lib/tournaments";

interface TournamentHeaderProps {
  tournament: TournamentConfig;
  roundStatus: string;
  lastUpdated: Date | null;
  onRefresh: () => void;
}

export default function TournamentHeader({
  tournament,
  roundStatus,
  lastUpdated,
  onRefresh,
}: TournamentHeaderProps) {
  const formattedTime = lastUpdated
    ? `UPDATED: ${lastUpdated
        .toLocaleDateString("en-US", { month: "short", day: "numeric" })
        .toUpperCase()}, ${lastUpdated
        .toLocaleTimeString("en-US", {
          hour: "numeric",
          minute: "2-digit",
        })
        .toUpperCase()}`
    : "";

  return (
    <header className="relative overflow-hidden">
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: `linear-gradient(to bottom, ${tournament.theme.gradientFrom}, ${tournament.theme.gradientVia}, ${tournament.theme.gradientTo})`,
        }}
      />

      <div
        className="absolute inset-0 opacity-[0.07]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='6' height='6' viewBox='0 0 6 6' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 0h1v1H0zm2 2h1v1H2zm2 2h1v1H4z' fill='%23ffffff' fill-opacity='1'/%3E%3C/svg%3E")`,
        }}
      />

      <div className="relative max-w-6xl mx-auto px-4 pt-5 pb-6 sm:pt-6 sm:pb-8">
        <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-8">
          <div className="shrink-0">
            <Image
              src="/logo-v3.png"
              alt={`${tournament.name} logo`}
              width={130}
              height={150}
              className="drop-shadow-lg w-[70px] h-[80px] sm:w-[130px] sm:h-[150px]"
              priority
            />
          </div>

          <div className="text-center">
            <h1 className="text-2xl sm:text-5xl md:text-[3.5rem] font-bold text-white tracking-[0.18em] font-serif uppercase leading-tight">
              {tournament.name}
            </h1>
            <p
              className="hidden sm:block text-xs mt-2 tracking-[0.35em] uppercase font-medium"
              style={{ color: tournament.theme.badgeText }}
            >
              Pick &apos;Em League Standings
            </p>
            <button
              onClick={onRefresh}
              className="hidden sm:inline-flex items-center gap-2 mt-3 text-[#9aa0a6] text-[11px] tracking-[0.12em] uppercase hover:text-white transition-colors cursor-pointer"
            >
              <span>{formattedTime || roundStatus}</span>
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
