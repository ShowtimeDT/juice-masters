/**
 * Shared input-validation limits and helpers for API routes. Centralized so
 * the bounds are consistent and easy to adjust in one place.
 */

export const LIMITS = {
  nameMaxLength: 120, // league names, team names, display names, golfer names
  maxTiers: 50,
  maxGolfers: 400, // 8 tiers × 10 = 80 in practice; generous headroom
  maxMembers: 500,
  tiebreakerMin: 0,
  tiebreakerMax: 2000, // total birdies in a major is well under this
} as const;

/** A non-empty string within the name length limit. Returns null if invalid. */
export function cleanName(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (trimmed.length === 0 || trimmed.length > LIMITS.nameMaxLength) return null;
  return trimmed;
}

/** True when an array exists and is within the given size cap. */
export function withinSize(value: unknown, max: number): value is unknown[] {
  return Array.isArray(value) && value.length <= max;
}

/** League passwords: 4–72 chars (bcrypt's effective input limit). */
export function validLeaguePassword(value: unknown): value is string {
  return typeof value === "string" && value.length >= 4 && value.length <= 72;
}

/**
 * Usernames: 3–30 chars, letters/numbers/underscores, stored lowercase.
 * Returns the normalized handle, or null if invalid.
 */
export function cleanUsername(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim().replace(/^@/, "").toLowerCase();
  if (!/^[a-z0-9_]{3,30}$/.test(trimmed)) return null;
  return trimmed;
}

/** Chat messages: trimmed, 1–1000 chars. Returns null if invalid. */
export function cleanMessage(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (trimmed.length === 0 || trimmed.length > 1000) return null;
  return trimmed;
}

/** True when a tiebreaker guess is a sensible whole number. */
export function validTiebreaker(value: unknown): value is number {
  return (
    typeof value === "number" &&
    Number.isFinite(value) &&
    Number.isInteger(value) &&
    value >= LIMITS.tiebreakerMin &&
    value <= LIMITS.tiebreakerMax
  );
}
