"use client";

import { TournamentConfig } from "@/lib/tournaments";
import { useTheme } from "@/lib/ThemeContext";

interface TournamentPlaceholderProps {
  config: TournamentConfig;
}

type TournamentState = "upcoming" | "in-progress" | "completed";

function getTournamentState(config: TournamentConfig): TournamentState {
  const now = new Date();

  // Parse start/end from espnDatesParam (format: "20260409-20260412")
  if (!config.espnDatesParam) return "upcoming";
  const [startStr, endStr] = config.espnDatesParam.split("-");
  if (!startStr || !endStr) return "upcoming";

  const startDate = new Date(
    parseInt(startStr.slice(0, 4)),
    parseInt(startStr.slice(4, 6)) - 1,
    parseInt(startStr.slice(6, 8))
  );
  // End date: tournament ends at ~midnight after the last day
  const endDate = new Date(
    parseInt(endStr.slice(0, 4)),
    parseInt(endStr.slice(4, 6)) - 1,
    parseInt(endStr.slice(6, 8)),
    23, 59, 59
  );

  if (now > endDate) return "completed";
  if (now >= startDate) return "in-progress";
  return "upcoming";
}

export default function TournamentPlaceholder({ config }: TournamentPlaceholderProps) {
  const theme = useTheme();
  const state = getTournamentState(config);

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
          {state === "in-progress" && (
            <>
              <div className="w-12 h-12 rounded-full mx-auto mb-4 flex items-center justify-center" style={{ backgroundColor: theme.highlightBg }}>
                <svg className="w-6 h-6" style={{ color: theme.badgeText }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <p className="text-sm font-medium" style={{ color: theme.badgeText }}>
                Tournament In Progress
              </p>
              <p className="text-gray-500 text-xs mt-2">
                This tournament is currently underway but no draft was set up for your league.
                Contact your league commissioner to set up a draft before the next major!
              </p>
            </>
          )}

          {state === "completed" && (
            <>
              <div className="w-12 h-12 rounded-full mx-auto mb-4 flex items-center justify-center" style={{ backgroundColor: theme.highlightBg }}>
                <svg className="w-6 h-6" style={{ color: theme.accent }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p className="text-gray-300 text-sm">
                Tournament Complete
              </p>
              <p className="text-gray-500 text-xs mt-2">
                This tournament has finished. No draft was set up for your league for this event.
              </p>
            </>
          )}

          {state === "upcoming" && (
            <>
              <div className="w-12 h-12 rounded-full mx-auto mb-4 flex items-center justify-center" style={{ backgroundColor: theme.highlightBg }}>
                <svg className="w-6 h-6" style={{ color: theme.accent }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <p className="text-gray-300 text-sm mb-2">
                Draft Coming Soon
              </p>
              <p className="text-gray-500 text-xs">
                The field is expected to be confirmed by{" "}
                <span className="text-gray-300">{config.fieldConfirmationDate}</span>.
                Your league commissioner will open the draft when the field is set!
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
