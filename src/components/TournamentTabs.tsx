"use client";

import { TOURNAMENTS, TournamentId } from "@/lib/tournaments";

interface TournamentTabsProps {
  activeId: TournamentId;
  onSelect: (id: TournamentId) => void;
}

export default function TournamentTabs({ activeId, onSelect }: TournamentTabsProps) {
  return (
    <nav className="bg-[#1a1a1a] border-b border-white/5">
      <div className="max-w-5xl mx-auto px-4">
        <div className="flex gap-1 overflow-x-auto">
          {TOURNAMENTS.map((t) => {
            const isActive = t.id === activeId;
            return (
              <button
                key={t.id}
                onClick={() => onSelect(t.id)}
                className={`shrink-0 px-4 sm:px-6 py-3 text-xs sm:text-sm font-medium tracking-[0.15em] uppercase transition-colors cursor-pointer ${
                  isActive ? "text-white" : "text-gray-500 hover:text-gray-300"
                }`}
                style={{
                  borderBottom: isActive
                    ? `2px solid ${t.theme.primary}`
                    : "2px solid transparent",
                }}
              >
                {t.shortName}
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
