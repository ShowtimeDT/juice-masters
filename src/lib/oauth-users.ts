import type { Account, Profile } from "next-auth";
import { randomBytes } from "node:crypto";
import { getDb } from "./db";

/**
 * Resolve an OAuth sign-in (Google, Apple) to a users.id, creating or
 * linking accounts as needed. Identity keys on the provider's stable
 * subject id — Apple only sends name/email on the FIRST authorization,
 * so email can never be the primary key.
 *
 * Linking policy: an OAuth identity with a verified email attaches to an
 * existing account with that email (one user row, multiple login methods).
 */
export async function resolveOAuthUser(
  account: Account,
  profile: Profile | undefined
): Promise<string | null> {
  const sql = getDb();
  const provider = account.provider;
  const providerAccountId = account.providerAccountId;

  // 1. Known identity → existing user.
  const [identity] = await sql`
    SELECT user_id FROM user_identities
    WHERE provider = ${provider} AND provider_account_id = ${providerAccountId}
  `;
  if (identity) return identity.user_id as string;

  // 2. Verified email matching an existing account → link.
  const email = normalizedEmail(profile);
  if (email && emailIsVerified(provider, profile)) {
    const [existing] = await sql`SELECT id FROM users WHERE lower(email) = ${email}`;
    if (existing) {
      await linkIdentity(provider, providerAccountId, existing.id as string);
      return existing.id as string;
    }
  }

  // 3. Brand-new user.
  if (!email) return null; // can't create an account without an email
  const name = profile?.name || email.split("@")[0];
  const username = await availableUsername(email);
  const [user] = await sql`
    INSERT INTO users (email, name, username)
    VALUES (${email}, ${name}, ${username})
    ON CONFLICT (email) DO UPDATE SET email = EXCLUDED.email
    RETURNING id
  `;
  await linkIdentity(provider, providerAccountId, user.id as string);
  return user.id as string;
}

function normalizedEmail(profile: Profile | undefined): string | null {
  const email = profile?.email;
  return email ? email.trim().toLowerCase() : null;
}

function emailIsVerified(provider: string, profile: Profile | undefined): boolean {
  // Apple emails are always verified (or private-relay). Google sends a flag.
  if (provider === "apple") return true;
  return (profile as { email_verified?: boolean } | undefined)?.email_verified === true;
}

async function linkIdentity(
  provider: string,
  providerAccountId: string,
  userId: string
): Promise<void> {
  const sql = getDb();
  await sql`
    INSERT INTO user_identities (provider, provider_account_id, user_id)
    VALUES (${provider}, ${providerAccountId}, ${userId})
    ON CONFLICT DO NOTHING
  `;
}

/** email local-part, sanitized, with a random suffix if taken. */
async function availableUsername(email: string): Promise<string> {
  const sql = getDb();
  const base = email.split("@")[0].replace(/[^a-zA-Z0-9_]/g, "_").slice(0, 24) || "player";
  const [taken] = await sql`SELECT 1 FROM users WHERE username = ${base}`;
  if (!taken) return base;
  return `${base}_${randomBytes(2).toString("hex")}`;
}
