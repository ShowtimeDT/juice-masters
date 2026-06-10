import { Entry } from "../types";
import { TournamentId } from "../tournaments";
import { MASTERS_ENTRIES } from "./masters";
import { PGA_ENTRIES } from "./pga";
import { US_OPEN_ENTRIES } from "./us-open";
import { THE_OPEN_ENTRIES } from "./the-open";

export { NAME_ALIASES, resolveGolferName } from "./aliases";

export function getEntriesForTournament(id: TournamentId): Entry[] {
  switch (id) {
    case "masters":
      return MASTERS_ENTRIES;
    case "pga":
      return PGA_ENTRIES;
    case "us-open":
      return US_OPEN_ENTRIES;
    case "the-open":
      return THE_OPEN_ENTRIES;
    case "season":
      return [];
  }
}
