import { TOURNAMENTS } from "@/lib/tournaments";
import type { DbRow } from "@/lib/authz";

/** Minutes before the first tee time that picks lock automatically. */
export const LOCK_MINUTES_BEFORE = 15;

/**
 * The moment picks lock for a draft: the commissioner-set close_time when
 * present, otherwise 15 minutes before the tournament's first tee time.
 * Returns null when neither is configured.
 */
export function draftDeadline(draft: DbRow): Date | null {
  if (draft.close_time) {
    return new Date(draft.close_time as string);
  }
  const tournament = TOURNAMENTS.find((t) => t.id === draft.tournament_id);
  if (tournament?.firstTeeTime) {
    const deadline = new Date(tournament.firstTeeTime);
    deadline.setMinutes(deadline.getMinutes() - LOCK_MINUTES_BEFORE);
    return deadline;
  }
  return null;
}

export function isPastDeadline(draft: DbRow): boolean {
  const deadline = draftDeadline(draft);
  return deadline !== null && new Date() >= deadline;
}
