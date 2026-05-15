import { Entry } from "../types";
import { TournamentId } from "../tournaments";
import { MASTERS_ENTRIES } from "./masters";
import { PGA_ENTRIES } from "./pga";

export { NAME_ALIASES, resolveGolferName } from "./aliases";

export function getEntriesForTournament(id: TournamentId): Entry[] {
  switch (id) {
    case "masters":
      return MASTERS_ENTRIES;
    case "pga":
      return PGA_ENTRIES;
  }
}
