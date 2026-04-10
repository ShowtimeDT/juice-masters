"use client";

import { TournamentConfig } from "@/lib/tournaments";
import { useTheme } from "@/lib/ThemeContext";

interface TournamentPlaceholderProps {
  config: TournamentConfig;
}

export default function TournamentPlaceholder({ config }: TournamentPlaceholderProps) {
  const theme = useTheme();

  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="text-center px-6 max-w-md">
        <h2
          className="text-3xl sm:text-4xl font-serif font-bold uppercase tracking-wide mb-3"
          style={{ color: theme.accent }}
        >
          {config.name}
        </h2>
        <p className="text-gray-300 text-lg mb-1">{config.dates}</p>
        <p className="text-gray-500 text-sm mb-8">{config.venue}</p>

        <div className="bg-[#1e2124] rounded-lg border border-[#3a3e3a] p-6">
          <div className="w-12 h-12 rounded-full mx-auto mb-4 flex items-center justify-center" style={{ backgroundColor: theme.highlightBg }}>
            <svg className="w-6 h-6" style={{ color: theme.accent }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <p className="text-gray-300 text-sm mb-2">
            Entries coming soon
          </p>
          <p className="text-gray-500 text-xs">
            The field is expected to be confirmed by{" "}
            <span className="text-gray-300">{config.fieldConfirmationDate}</span>.
            Check back then to make your picks!
          </p>
        </div>
      </div>
    </div>
  );
}
