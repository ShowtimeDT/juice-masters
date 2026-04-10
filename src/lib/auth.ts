import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { getDb } from "./db";

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const sql = getDb();
        const email = credentials.email as string;
        const password = credentials.password as string;

        const [user] = await sql`SELECT * FROM users WHERE email = ${email}`;
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
    async jwt({ token, user }) {
      if (user) {
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
