import { Entry } from "../types";
import { TournamentId } from "../tournaments";
import { MASTERS_ENTRIES } from "./masters";
import { PGA_ENTRIES } from "./pga";
import { US_OPEN_ENTRIES } from "./us-open";
import { THE_OPEN_ENTRIES } from "./the-open";

const ENTRIES_MAP: Record<Exclude<TournamentId, "season">, Entry[]> = {
  masters: MASTERS_ENTRIES,
  pga: PGA_ENTRIES,
  "us-open": US_OPEN_ENTRIES,
  "the-open": THE_OPEN_ENTRIES,
};

export function getEntriesForTournament(id: TournamentId): Entry[] {
  if (id === "season") return [];
  return ENTRIES_MAP[id] || [];
}

// Name aliases: entry name -> ESPN's athlete.fullName
export const NAME_ALIASES: Record<string, string> = {
  "Ludvig Aberg": "Ludvig Åberg",
  "Nicolai Hojgaard": "Nicolai Højgaard",
  "Rasmus Hojgaard": "Rasmus Højgaard",
  "Sami Valimaki": "Sami Välimäki",
  "Sung-Jae Im": "Sungjae Im",
  "JJ Spaun": "J.J. Spaun",
  "John Keefer": "Johnny Keefer",
  "Rasmus Neergaard": "Rasmus Neergaard-Petersen",
};

export function resolveGolferName(name: string): string {
  return NAME_ALIASES[name] || name;
}
