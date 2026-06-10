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

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  providers: [
    Google,
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
        if (!user) return null;

        const [pw] = await sql`SELECT password_hash FROM user_passwords WHERE user_id = ${user.id}`;
        if (!pw) return null;

        const valid = await bcrypt.compare(password, pw.password_hash as string);
        if (!valid) return null;

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
