import { TOURNAMENTS, TournamentConfig, TournamentId } from "./tournaments";
import { getTournamentState } from "./tournament-state";

/** The single value that reshapes the whole dashboard. */
export type DashboardPhase = "off" | "draft" | "live";

export const MAJORS: TournamentConfig[] = TOURNAMENTS.filter((t) => t.id !== "season");

export function getLiveMajor(): TournamentConfig | null {
  return MAJORS.find((m) => getTournamentState(m) === "in-progress") ?? null;
}

export function getLastCompletedMajor(): TournamentConfig | null {
  const done = MAJORS.filter((m) => getTournamentState(m) === "completed");
  return done.length ? done[done.length - 1] : null;
}

export function getNextUpcomingMajor(): TournamentConfig | null {
  return MAJORS.find((m) => getTournamentState(m) === "upcoming") ?? null;
}

/** Start date (local midnight) parsed from a tournament's espnDatesParam "YYYYMMDD-YYYYMMDD". */
export function majorStartDate(config: TournamentConfig): Date | null {
  const start = config.espnDatesParam.split("-")[0];
  if (!start || start.length < 8) return null;
  return new Date(
    Number(start.slice(0, 4)),
    Number(start.slice(4, 6)) - 1,
    Number(start.slice(6, 8))
  );
}

/** Whole days from now until a major starts (0 if today/past). */
export function daysUntilMajor(config: TournamentConfig): number {
  const start = majorStartDate(config);
  if (!start) return 0;
  const ms = start.getTime() - Date.now();
  return Math.max(0, Math.ceil(ms / 86_400_000));
}

/** "6h 12m" / "2d 4h" / "12m" — compact countdown from now to an ISO deadline. */
export function formatCountdown(iso: string | null | undefined): string | null {
  if (!iso) return null;
  const ms = new Date(iso).getTime() - Date.now();
  if (!Number.isFinite(ms) || ms <= 0) return null;
  const mins = Math.floor(ms / 60_000);
  const days = Math.floor(mins / 1440);
  const hours = Math.floor((mins % 1440) / 60);
  const minutes = mins % 60;
  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

/** Ordinal rank: 1 → "1st", 2 → "2nd", 11 → "11th". */
export function ordinal(n: number): string {
  const v = n % 100;
  if (v >= 11 && v <= 13) return `${n}th`;
  return n + ({ 1: "st", 2: "nd", 3: "rd" }[n % 10] ?? "th");
}

/**
 * Derive the dashboard phase: a live major wins; otherwise an open draft in any
 * of the user's leagues means draft week; otherwise off-season.
 */
export function derivePhase(hasOpenDraft: boolean): DashboardPhase {
  if (getLiveMajor()) return "live";
  if (hasOpenDraft) return "draft";
  return "off";
}

/** The major whose data the dashboard focuses on for the current phase. */
export function focusMajorId(phase: DashboardPhase): TournamentId {
  if (phase === "live") return (getLiveMajor() ?? MAJORS[0]).id;
  return (getLastCompletedMajor() ?? getNextUpcomingMajor() ?? MAJORS[0]).id;
}
