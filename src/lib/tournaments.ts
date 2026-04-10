export type TournamentId = "masters" | "pga" | "us-open" | "the-open" | "season";

export interface TournamentTheme {
  primary: string;
  gradientFrom: string;
  gradientVia: string;
  gradientTo: string;
  accent: string;
  accentHover: string;
  accentMuted: string;
  highlightBg: string;
  badgeText: string;
}

export interface TournamentConfig {
  id: TournamentId;
  name: string;
  shortName: string;
  dates: string;
  dateRange: string;
  espnDatesParam: string;
  venue: string;
  theme: TournamentTheme;
  hasEntries: boolean;
  fieldConfirmationDate: string;
  firstTeeTime: string; // ISO datetime of first tee time (ET)
}

const mastersTheme: TournamentTheme = {
  primary: "#006747",
  gradientFrom: "#3a5c3c",
  gradientVia: "#2e4e30",
  gradientTo: "#1e3a24",
  accent: "#3a5a3a",
  accentHover: "#4a7a4a",
  accentMuted: "#8a9e82",
  highlightBg: "rgba(0, 103, 71, 0.15)",
  badgeText: "#4ade80",
};

const pgaTheme: TournamentTheme = {
  primary: "#00205B",
  gradientFrom: "#1a3a6b",
  gradientVia: "#122d55",
  gradientTo: "#0a1a3b",
  accent: "#C8A951",
  accentHover: "#d4b96a",
  accentMuted: "#8a9ab2",
  highlightBg: "rgba(0, 32, 91, 0.15)",
  badgeText: "#7ab8ff",
};

const usOpenTheme: TournamentTheme = {
  primary: "#C41E3A",
  gradientFrom: "#8b1a2e",
  gradientVia: "#5a1220",
  gradientTo: "#3a0a15",
  accent: "#003865",
  accentHover: "#0a4a7a",
  accentMuted: "#b08a92",
  highlightBg: "rgba(196, 30, 58, 0.15)",
  badgeText: "#ff7a8a",
};

const theOpenTheme: TournamentTheme = {
  primary: "#1C2841",
  gradientFrom: "#2a3a5a",
  gradientVia: "#1e2d45",
  gradientTo: "#0f1a2e",
  accent: "#C3A24D",
  accentHover: "#d4b46a",
  accentMuted: "#8a9aaa",
  highlightBg: "rgba(28, 40, 65, 0.15)",
  badgeText: "#7ab8ff",
};

const seasonTheme: TournamentTheme = {
  primary: "#2a2a2a",
  gradientFrom: "#3a3a3a",
  gradientVia: "#2a2a2a",
  gradientTo: "#1a1a1a",
  accent: "#C8A951",
  accentHover: "#d4b96a",
  accentMuted: "#9a9a9a",
  highlightBg: "rgba(200, 169, 81, 0.15)",
  badgeText: "#C8A951",
};

export const TOURNAMENTS: TournamentConfig[] = [
  {
    id: "masters",
    name: "Juice Masters",
    shortName: "Masters",
    dates: "Apr 9–12, 2026",
    dateRange: "April 9-12",
    espnDatesParam: "20260409-20260412",
    venue: "Augusta National Golf Club",
    theme: mastersTheme,
    hasEntries: true,
    fieldConfirmationDate: "Mid-March 2026",
    firstTeeTime: "2026-04-09T08:00:00-04:00",
  },
  {
    id: "pga",
    name: "The Juice Championship",
    shortName: "Championship",
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
    name: "The Juice Open",
    shortName: "Open",
    dates: "Jun 18–21, 2026",
    dateRange: "June 18-21",
    espnDatesParam: "20260618-20260621",
    venue: "Shinnecock Hills Golf Club",
    theme: usOpenTheme,
    hasEntries: false,
    fieldConfirmationDate: "Early June 2026",
    firstTeeTime: "2026-06-18T06:45:00-04:00",
  },
  {
    id: "the-open",
    name: "The Juice Invitational",
    shortName: "Invitational",
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
    shortName: "Tour",
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
  return TOURNAMENTS.find((t) => t.id === id) || TOURNAMENTS[0];
}
