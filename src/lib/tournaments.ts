export type TournamentId = "masters" | "pga" | "us-open" | "the-open";

export interface TournamentTheme {
  primary: string;
  gradientFrom: string;
  gradientVia: string;
  gradientTo: string;
  accent: string;
  badgeText: string;
}

export interface TournamentConfig {
  id: TournamentId;
  name: string;
  shortName: string;
  espnDatesParam: string;
  theme: TournamentTheme;
}

const mastersTheme: TournamentTheme = {
  primary: "#006747",
  gradientFrom: "#3a5c3c",
  gradientVia: "#2e4e30",
  gradientTo: "#1e3a24",
  accent: "#006747",
  badgeText: "#4ade80",
};

const pgaTheme: TournamentTheme = {
  primary: "#C8A951",
  gradientFrom: "#00205B",
  gradientVia: "#122d55",
  gradientTo: "#0a1a3b",
  accent: "#C8A951",
  badgeText: "#C8A951",
};

const usOpenTheme: TournamentTheme = {
  primary: "#C41E3A",
  gradientFrom: "#8b1a2e",
  gradientVia: "#5a1220",
  gradientTo: "#3a0a15",
  accent: "#003865",
  badgeText: "#ff7a8a",
};

const theOpenTheme: TournamentTheme = {
  primary: "#C3A24D",
  gradientFrom: "#2a3a5a",
  gradientVia: "#1e2d45",
  gradientTo: "#0f1a2e",
  accent: "#C3A24D",
  badgeText: "#7ab8ff",
};

export const TOURNAMENTS: TournamentConfig[] = [
  {
    id: "masters",
    name: "Juice Masters",
    shortName: "Masters",
    espnDatesParam: "20260409-20260412",
    theme: mastersTheme,
  },
  {
    id: "pga",
    name: "Juice\nChampionship",
    shortName: "PGA Championship",
    espnDatesParam: "20260514-20260517",
    theme: pgaTheme,
  },
  {
    id: "us-open",
    name: "Juice Open",
    shortName: "U.S. Open",
    espnDatesParam: "20260618-20260621",
    theme: usOpenTheme,
  },
  {
    id: "the-open",
    name: "Juice Open Championship",
    shortName: "The Open",
    espnDatesParam: "20260716-20260719",
    theme: theOpenTheme,
  },
];

export function getTournament(id: TournamentId): TournamentConfig {
  return TOURNAMENTS.find((t) => t.id === id) ?? TOURNAMENTS[1];
}

export function isTournamentId(value: string | null | undefined): value is TournamentId {
  return (
    value === "masters" ||
    value === "pga" ||
    value === "us-open" ||
    value === "the-open"
  );
}
