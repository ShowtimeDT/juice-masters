import { auth } from "@/lib/auth";
import { getDb } from "@/lib/db";

/**
 * Authorization helpers for API routes. Each returns { ok: true, ... } or
 * { ok: false, status, error } which callers turn into a JSON response:
 *
 *   const authz = await requireDraftCommissioner(draftId);
 *   if (!authz.ok) return authzError(authz);
 */

export type AuthzFailure = { ok: false; status: 401 | 403 | 404; error: string };

export type DbRow = Record<string, unknown>;

export interface LeagueMemberRow extends DbRow {
  id: number;
  league_id: string;
  user_id: string | null;
  display_name: string;
  team_name: string | null;
}

const notAuthenticated: AuthzFailure = {
  ok: false,
  status: 401,
  error: "Not authenticated",
};

function forbidden(error: string): AuthzFailure {
  return { ok: false, status: 403, error };
}

function notFound(error: string): AuthzFailure {
  return { ok: false, status: 404, error };
}

export function authzError(failure: AuthzFailure): Response {
  return Response.json({ error: failure.error }, { status: failure.status });
}

/** The caller has a session. */
export async function requireUser(): Promise<{ ok: true; userId: string } | AuthzFailure> {
  const session = await auth();
  if (!session?.user?.id) return notAuthenticated;
  return { ok: true, userId: session.user.id };
}

/** The caller is the commissioner of the league. */
export async function requireLeagueCommissioner(
  leagueId: string
): Promise<{ ok: true; userId: string } | AuthzFailure> {
  const user = await requireUser();
  if (!user.ok) return user;

  const sql = getDb();
  const [league] = await sql`SELECT commissioner_id FROM leagues WHERE id = ${leagueId}`;
  if (!league) return notFound("League not found");
  if (league.commissioner_id !== user.userId) {
    return forbidden("Only the league commissioner can do this");
  }
  return { ok: true, userId: user.userId };
}

/** The caller is the commissioner of the league this draft belongs to. */
export async function requireDraftCommissioner(
  draftId: string
): Promise<{ ok: true; userId: string; draft: DbRow; leagueId: string } | AuthzFailure> {
  const user = await requireUser();
  if (!user.ok) return user;

  const sql = getDb();
  const [draft] = await sql`SELECT * FROM drafts WHERE id = ${draftId}`;
  if (!draft) return notFound("Draft not found");
  if (!draft.league_id) return forbidden("Draft has no league");

  const [league] = await sql`SELECT commissioner_id FROM leagues WHERE id = ${draft.league_id}`;
  if (league?.commissioner_id !== user.userId) {
    return forbidden("Only the league commissioner can do this");
  }
  return { ok: true, userId: user.userId, draft, leagueId: draft.league_id as string };
}

/** The caller is a member of the league; returns their member row. */
export async function requireLeagueMember(
  leagueId: string
): Promise<{ ok: true; userId: string; member: LeagueMemberRow } | AuthzFailure> {
  const user = await requireUser();
  if (!user.ok) return user;

  const sql = getDb();
  const [member] = await sql`
    SELECT * FROM league_members
    WHERE league_id = ${leagueId} AND user_id = ${user.userId}
  `;
  if (!member) return forbidden("You are not a member of this league");
  return { ok: true, userId: user.userId, member: member as LeagueMemberRow };
}

/**
 * Whether the current caller may VIEW a league's content (standings etc.).
 * Public leagues: always. Private leagues: members/commissioner, or anyone
 * presenting the league's invite code (possession of the link = invited).
 * Chat is members-only separately, regardless of this.
 */
export async function canViewLeague(
  league: { id?: unknown; is_private?: unknown; invite_code?: unknown },
  inviteCode?: string | null
): Promise<boolean> {
  if (!league.is_private) return true;
  if (inviteCode && league.invite_code && inviteCode === league.invite_code) return true;
  return isLeagueMemberOrCommissioner(league.id as string);
}

/** Look up a league by id, then apply canViewLeague. For draft-side reads. */
export async function canViewLeagueById(
  leagueId: string,
  inviteCode?: string | null
): Promise<boolean> {
  const sql = getDb();
  const [league] = await sql`
    SELECT id, is_private, invite_code FROM leagues WHERE id = ${leagueId}
  `;
  if (!league) return false;
  return canViewLeague(league, inviteCode);
}

/** True when the caller (if any) is a member or commissioner of the league. */
export async function isLeagueMemberOrCommissioner(leagueId: string): Promise<boolean> {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return false;

  const sql = getDb();
  const [row] = await sql`
    SELECT 1 FROM leagues l
    LEFT JOIN league_members lm ON lm.league_id = l.id AND lm.user_id = ${userId}
    WHERE l.id = ${leagueId} AND (l.commissioner_id = ${userId} OR lm.user_id IS NOT NULL)
    LIMIT 1
  `;
  return !!row;
}
