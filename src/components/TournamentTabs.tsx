"use client";

import { TOURNAMENTS, TournamentId } from "@/lib/tournaments";

interface TournamentTabsProps {
  activeId: TournamentId;
  onSelect: (id: TournamentId) => void;
}

export default function TournamentTabs({ activeId, onSelect }: TournamentTabsProps) {
  return (
    <div className="bg-[#111314] border-b border-[#2a2e2a]">
      <div className="max-w-5xl mx-auto px-4">
        <nav className="flex overflow-x-auto scrollbar-hide -mb-px" aria-label="Tournament tabs">
          {TOURNAMENTS.map((t) => {
            const isActive = t.id === activeId;
            return (
              <button
                key={t.id}
                onClick={() => onSelect(t.id)}
                className={`shrink-0 px-4 sm:px-6 py-3 text-xs sm:text-sm font-medium uppercase tracking-wider transition-colors cursor-pointer border-b-2 ${
                  isActive
                    ? "text-white"
                    : "text-gray-500 hover:text-gray-300 border-transparent"
                }`}
                style={{
                  borderBottomColor: isActive ? t.theme.primary : "transparent",
                }}
              >
                {t.shortName}
              </button>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
