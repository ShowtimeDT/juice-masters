"use client";

import Image from "next/image";
import { useTheme } from "@/lib/ThemeContext";

interface TournamentHeaderProps {
  tournamentName: string;
  roundStatus: string;
  lastUpdated: Date | null;
  onRefresh: () => void;
}

export default function TournamentHeader({
  tournamentName,
  roundStatus,
  lastUpdated,
  onRefresh,
}: TournamentHeaderProps) {
  const theme = useTheme();

  const formattedTime = lastUpdated
    ? `UPDATED: ${lastUpdated
        .toLocaleDateString("en-US", { month: "short", day: "numeric" })
        .toUpperCase()}, ${lastUpdated.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
      }).toUpperCase()}`
    : "";

  return (
    <header className="relative overflow-hidden">
      {/* Gradient background — themed per tournament */}
      <div
        className="absolute inset-0"
        style={{
          background: `linear-gradient(to bottom, ${theme.gradientFrom}, ${theme.gradientVia}, ${theme.gradientTo})`,
        }}
      />

      {/* Texture overlay */}
      <div
        className="absolute inset-0 opacity-[0.07]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='6' height='6' viewBox='0 0 6 6' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 0h1v1H0zm2 2h1v1H2zm2 2h1v1H4z' fill='%23ffffff' fill-opacity='1'/%3E%3C/svg%3E")`,
        }}
      />

      {/* Content */}
      <div className="relative max-w-6xl mx-auto px-4 pt-5 pb-6 sm:pt-6 sm:pb-8">
        <div className="flex flex-col items-center text-center gap-2">
          {/* Logo */}
          <div className="shrink-0">
            <Image
              src="/logo-v3.png"
              alt="Juice Logo"
              width={130}
              height={150}
              className="drop-shadow-lg w-[70px] h-[80px] sm:w-[100px] sm:h-[115px]"
              priority
            />
          </div>

          {/* Title block */}
          <div>
            <h1 className="text-2xl sm:text-4xl md:text-5xl font-bold text-white tracking-[0.18em] font-serif uppercase leading-tight">
              {tournamentName}
            </h1>
            <p
              className="hidden sm:block text-xs mt-2 tracking-[0.35em] uppercase font-medium"
              style={{ color: theme.accentMuted }}
            >
              Pick &apos;Em League Standings
            </p>
            {(formattedTime || roundStatus) && (
              <button
                onClick={onRefresh}
                className="hidden sm:inline-flex items-center gap-2 mt-2 text-[11px] tracking-[0.12em] uppercase hover:text-white transition-colors cursor-pointer"
                style={{ color: theme.accentMuted }}
              >
                <span>{formattedTime || roundStatus}</span>
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
