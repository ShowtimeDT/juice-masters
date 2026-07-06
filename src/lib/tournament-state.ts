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

/** End-of-play date (last round, end of day) parsed from espnDatesParam. */
function majorEndDate(config: TournamentConfig): Date | null {
  const end = config.espnDatesParam.split("-")[1];
  if (!end || end.length < 8) return null;
  return new Date(
    parseInt(end.slice(0, 4)),
    parseInt(end.slice(4, 6)) - 1,
    parseInt(end.slice(6, 8)),
    23,
    59,
    59
  );
}

/** Keep showing a finished major for a week after it ends. */
const POST_MAJOR_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;

/**
 * The tournament tab a league page should open on: the live major during
 * tournament week, the most recent major for a week after it finishes, then the
 * season standings.
 */
export function defaultTournamentTab(): TournamentId {
  const majors = TOURNAMENTS.filter((t) => t.id !== "season");
  const live = majors.find((t) => getTournamentState(t) === "in-progress");
  if (live) return live.id;

  const now = Date.now();
  const recent = majors
    .filter((t) => getTournamentState(t) === "completed")
    .map((t) => ({ t, end: majorEndDate(t) }))
    .filter(
      (x): x is { t: TournamentConfig; end: Date } =>
        x.end !== null && now - x.end.getTime() <= POST_MAJOR_WINDOW_MS
    )
    .sort((a, b) => b.end.getTime() - a.end.getTime())[0];

  return recent ? recent.t.id : "season";
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
