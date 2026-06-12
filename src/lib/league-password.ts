import {
  createCipheriv,
  createDecipheriv,
  createHash,
  randomBytes,
  timingSafeEqual,
} from "crypto";

/**
 * League passwords are shared join codes (not personal credentials), so they
 * are stored encrypted — recoverable by the commissioner — rather than
 * one-way hashed. The key is derived from AUTH_SECRET, which lives only in
 * the environment: a database leak alone can't read them. Note: rotating
 * AUTH_SECRET makes existing stored passwords unreadable (commissioners
 * would just set new ones).
 */

const VERSION = "v1";

function encryptionKey(): Buffer {
  const secret = process.env.AUTH_SECRET;
  if (!secret) throw new Error("AUTH_SECRET is required to encrypt league passwords");
  return createHash("sha256").update(`league-password:${secret}`).digest();
}

/** Encrypt a league password for storage (AES-256-GCM). */
export function encryptLeaguePassword(password: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", encryptionKey(), iv);
  const encrypted = Buffer.concat([cipher.update(password, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return [
    VERSION,
    iv.toString("base64"),
    encrypted.toString("base64"),
    tag.toString("base64"),
  ].join(":");
}

/** Decrypt a stored league password; null if missing, tampered, or unreadable. */
export function decryptLeaguePassword(stored: unknown): string | null {
  if (typeof stored !== "string" || !stored) return null;
  try {
    const [version, ivB64, encryptedB64, tagB64] = stored.split(":");
    if (version !== VERSION) return null;
    const decipher = createDecipheriv(
      "aes-256-gcm",
      encryptionKey(),
      Buffer.from(ivB64, "base64")
    );
    decipher.setAuthTag(Buffer.from(tagB64, "base64"));
    return Buffer.concat([
      decipher.update(Buffer.from(encryptedB64, "base64")),
      decipher.final(),
    ]).toString("utf8");
  } catch {
    return null;
  }
}

/** Constant-time check of a join attempt against the stored password. */
export function leaguePasswordMatches(attempt: string, stored: unknown): boolean {
  const actual = decryptLeaguePassword(stored);
  if (actual === null) return false;
  const a = Buffer.from(attempt, "utf8");
  const b = Buffer.from(actual, "utf8");
  return a.length === b.length && timingSafeEqual(a, b);
}
