export type TournamentId = "masters" | "pga";

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
    name: "Juice Championship",
    shortName: "PGA Championship",
    espnDatesParam: "20260514-20260517",
    theme: pgaTheme,
  },
];

export function getTournament(id: TournamentId): TournamentConfig {
  return TOURNAMENTS.find((t) => t.id === id) ?? TOURNAMENTS[1];
}

export function isTournamentId(value: string | null | undefined): value is TournamentId {
  return value === "masters" || value === "pga";
}
