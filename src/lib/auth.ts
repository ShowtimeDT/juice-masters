import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import bcrypt from "bcryptjs";
import { getDb } from "./db";
import { resolveOAuthUser } from "./oauth-users";

// To enable Apple Sign-In later (requires a paid Apple Developer account):
//   import Apple from "next-auth/providers/apple";
//   add Apple to providers and set AUTH_APPLE_ID / AUTH_APPLE_SECRET.
// resolveOAuthUser already handles any OAuth provider.

// Fail fast in production if the session-signing secret is missing, rather
// than silently falling back to an insecure default.
if (process.env.NODE_ENV === "production" && !process.env.AUTH_SECRET) {
  throw new Error("AUTH_SECRET must be set in production");
}

// Only register Google when its credentials exist, so a missing env var
// can never take down email/password login with it.
const googleConfigured = !!(process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET);

// A valid bcrypt hash of a random string, used to spend the same time on
// failed logins as successful ones (prevents email-enumeration by timing).
const DUMMY_HASH = "$2b$12$5FKNr6q0jxpvyQi.jIVUhuh34cB/OAHVcKZXOv30M5J0hhufp6dwG";

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  providers: [
    ...(googleConfigured ? [Google] : []),
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const sql = getDb();
        const email = (credentials.email as string).trim().toLowerCase();
        const password = credentials.password as string;

        const [user] = await sql`SELECT * FROM users WHERE lower(email) = ${email}`;
        const [pw] = user
          ? await sql`SELECT password_hash FROM user_passwords WHERE user_id = ${user.id}`
          : [];

        // Always run a bcrypt comparison — even when the user or password
        // row is missing — so login time doesn't reveal which emails exist.
        const hash = (pw?.password_hash as string) ?? DUMMY_HASH;
        const valid = await bcrypt.compare(password, hash);
        if (!user || !pw || !valid) return null;

        return {
          id: user.id as string,
          name: user.name as string,
          email: user.email as string,
        };
      },
    }),
  ],
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async signIn({ account, profile }) {
      // OAuth accounts must expose an email or we can't create a user row.
      if (account && account.provider !== "credentials") {
        return !!profile?.email;
      }
      return true;
    },
    async jwt({ token, user, account, profile }) {
      if (account && account.provider !== "credentials") {
        const userId = await resolveOAuthUser(account, profile);
        if (userId) {
          token.id = userId;
          // Show the app's stored name, not the provider's.
          const sql = getDb();
          const [dbUser] = await sql`SELECT name FROM users WHERE id = ${userId}`;
          if (dbUser?.name) token.name = dbUser.name as string;
        }
      } else if (user) {
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && token.id) {
        session.user.id = token.id as string;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
});
