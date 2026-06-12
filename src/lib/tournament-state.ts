import { TOURNAMENTS, TournamentConfig, TournamentId } from "./tournaments";

export type TournamentState = "upcoming" | "in-progress" | "completed";

/** Where a tournament sits relative to today, from its espnDatesParam. */
export function getTournamentState(config: TournamentConfig): TournamentState {
  const now = new Date();

  // espnDatesParam format: "20260618-20260621"
  if (!config.espnDatesParam) return "upcoming";
  const [startStr, endStr] = config.espnDatesParam.split("-");
  if (!startStr || !endStr) return "upcoming";

  const startDate = new Date(
    parseInt(startStr.slice(0, 4)),
    parseInt(startStr.slice(4, 6)) - 1,
    parseInt(startStr.slice(6, 8))
  );
  // The tournament "ends" at midnight after the last day (and often runs a
  // Monday finish; the extra evening hours don't matter for tab defaults).
  const endDate = new Date(
    parseInt(endStr.slice(0, 4)),
    parseInt(endStr.slice(4, 6)) - 1,
    parseInt(endStr.slice(6, 8)),
    23,
    59,
    59
  );

  if (now > endDate) return "completed";
  if (now >= startDate) return "in-progress";
  return "upcoming";
}

/**
 * The tournament tab a league page should open on: the live major during
 * tournament week, the season standings otherwise.
 */
export function defaultTournamentTab(): TournamentId {
  const live = TOURNAMENTS.find(
    (t) => t.id !== "season" && getTournamentState(t) === "in-progress"
  );
  return live?.id ?? "season";
}

/**
 * The major a My Team page should open on: the live major if one is
 * underway, otherwise the most recently completed one, otherwise the
 * first major of the season.
 */
export function defaultMyTeamMajor(): TournamentId {
  const majors = TOURNAMENTS.filter((t) => t.id !== "season");
  const live = majors.find((t) => getTournamentState(t) === "in-progress");
  if (live) return live.id;
  const completed = majors.filter((t) => getTournamentState(t) === "completed");
  if (completed.length > 0) return completed[completed.length - 1].id;
  return majors[0].id;
}
