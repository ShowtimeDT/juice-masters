export type TournamentId = "masters" | "pga" | "us-open" | "the-open" | "season";

/**
 * Per-tournament colors. App-wide colors (cards, borders, score green/red)
 * live in src/app/globals.css — edit there to retheme the whole site.
 */
export interface TournamentTheme {
  primary: string; // buttons, active tab underline, spinners
  gradientFrom: string; // header gradient top
  gradientVia: string; // header gradient middle
  gradientTo: string; // header gradient bottom
  accent: string; // highlights (tiebreaker winner, draft accents)
  accentHover: string; // accent hover state
  accentMuted: string; // de-emphasized accent text
  highlightBg: string; // translucent row-highlight background
  badgeText: string; // small uppercase text on the header gradient
}

export interface TournamentConfig {
  id: TournamentId;
  name: string; // display name ("Juice Masters")
  shortName: string; // tab label ("PGA Championship")
  columnLabel: string; // narrow-table label ("PGA")
  dates: string; // human-readable ("Jun 18–21, 2026")
  dateRange: string; // compact ("June 18-21")
  espnDatesParam: string; // ESPN scoreboard ?dates= value
  venue: string;
  theme: TournamentTheme;
  hasEntries: boolean; // static entries exist in src/lib/entries/
  fieldConfirmationDate: string; // when the field is expected to be final
  firstTeeTime: string; // ISO datetime of first tee time (ET); fallback auto-lock
}

/** Translucent version of a hex color (alpha 0–1) for row highlights. */
function withAlpha(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

const mastersTheme: TournamentTheme = {
  primary: "#006747",
  gradientFrom: "#3a5c3c",
  gradientVia: "#2e4e30",
  gradientTo: "#1e3a24",
  accent: "#006747",
  accentHover: "#0a8a5f",
  accentMuted: "#8a9e82",
  highlightBg: withAlpha("#006747", 0.15),
  badgeText: "#4ade80",
};

const pgaTheme: TournamentTheme = {
  primary: "#C8A951",
  gradientFrom: "#00205B",
  gradientVia: "#122d55",
  gradientTo: "#0a1a3b",
  accent: "#C8A951",
  accentHover: "#d4b96a",
  accentMuted: "#8a9ab2",
  highlightBg: withAlpha("#C8A951", 0.15),
  badgeText: "#C8A951",
};

const usOpenTheme: TournamentTheme = {
  primary: "#C41E3A",
  gradientFrom: "#8b1a2e",
  gradientVia: "#5a1220",
  gradientTo: "#3a0a15",
  accent: "#003865",
  accentHover: "#0a4a7a",
  accentMuted: "#b08a92",
  highlightBg: withAlpha("#C41E3A", 0.15),
  badgeText: "#ff7a8a",
};

const theOpenTheme: TournamentTheme = {
  primary: "#C3A24D",
  gradientFrom: "#2a3a5a",
  gradientVia: "#1e2d45",
  gradientTo: "#0f1a2e",
  accent: "#C3A24D",
  accentHover: "#d4b46a",
  accentMuted: "#8a9aaa",
  highlightBg: withAlpha("#C3A24D", 0.15),
  badgeText: "#7ab8ff",
};

const seasonTheme: TournamentTheme = {
  primary: "#C8A951",
  gradientFrom: "#3a3a3a",
  gradientVia: "#2a2a2a",
  gradientTo: "#1a1a1a",
  accent: "#C8A951",
  accentHover: "#d4b96a",
  accentMuted: "#9a9a9a",
  highlightBg: withAlpha("#C8A951", 0.15),
  badgeText: "#C8A951",
};

export const TOURNAMENTS: TournamentConfig[] = [
  {
    id: "masters",
    name: "Juice Masters",
    shortName: "Masters",
    columnLabel: "Masters",
    dates: "Apr 9–12, 2026",
    dateRange: "April 9-12",
    espnDatesParam: "20260409-20260412",
    venue: "Augusta National Golf Club",
    theme: mastersTheme,
    hasEntries: false,
    fieldConfirmationDate: "Mid-March 2026",
    firstTeeTime: "2026-04-09T08:00:00-04:00",
  },
  {
    id: "pga",
    name: "Juice\nChampionship",
    shortName: "PGA Championship",
    columnLabel: "PGA",
    dates: "May 14–17, 2026",
    dateRange: "May 14-17",
    espnDatesParam: "20260514-20260517",
    venue: "Aronimink Golf Club",
    theme: pgaTheme,
    hasEntries: false,
    fieldConfirmationDate: "Late April 2026",
    firstTeeTime: "2026-05-14T07:00:00-04:00",
  },
  {
    id: "us-open",
    name: "Juice Open",
    shortName: "U.S. Open",
    columnLabel: "U.S. Open",
    dates: "Jun 18–21, 2026",
    dateRange: "June 18-21",
    espnDatesParam: "20260618-20260621",
    venue: "Shinnecock Hills Golf Club",
    theme: usOpenTheme,
    hasEntries: false,
    fieldConfirmationDate: "Early June 2026",
    // Provisional — update when the USGA publishes tee times. The
    // commissioner-set draft close time is the real deadline control.
    firstTeeTime: "2026-06-18T06:45:00-04:00",
  },
  {
    id: "the-open",
    name: "Juice Open Championship",
    shortName: "The Open",
    columnLabel: "The Open",
    dates: "Jul 16–19, 2026",
    dateRange: "July 16-19",
    espnDatesParam: "20260716-20260719",
    venue: "Royal Portrush Golf Club",
    theme: theOpenTheme,
    hasEntries: false,
    fieldConfirmationDate: "Late June 2026",
    firstTeeTime: "2026-07-16T01:35:00-04:00",
  },
  {
    id: "season",
    name: "Juice Tour",
    shortName: "Season",
    columnLabel: "Season",
    dates: "2026 Season",
    dateRange: "Apr–Jul 2026",
    espnDatesParam: "",
    venue: "",
    theme: seasonTheme,
    hasEntries: false,
    fieldConfirmationDate: "",
    firstTeeTime: "",
  },
];

export function getTournament(id: TournamentId): TournamentConfig {
  return TOURNAMENTS.find((t) => t.id === id) ?? TOURNAMENTS[0];
}

export function isTournamentId(value: string | null | undefined): value is TournamentId {
  return TOURNAMENTS.some((t) => t.id === value);
}
