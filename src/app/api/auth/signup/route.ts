import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getDb } from "@/lib/db";

const BCRYPT_ROUNDS = 10;

function validateSignup(body: {
  email?: string;
  name?: string;
  username?: string;
  password?: string;
}): string | null {
  const { email, name, username, password } = body;
  if (!email || !name || !username || !password) return "All fields are required";
  if (password.length < 6) return "Password must be at least 6 characters";
  if (username.length < 3) return "Username must be at least 3 characters";
  if (!/^[a-zA-Z0-9_]+$/.test(username)) {
    return "Username can only contain letters, numbers, and underscores";
  }
  return null;
}

/** Postgres unique-constraint violation. */
function isUniqueViolation(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    (error as { code?: string }).code === "23505"
  );
}

export async function POST(request: NextRequest) {
  const sql = getDb();

  try {
    const body = await request.json();
    const validationError = validateSignup(body);
    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 });
    }

    const email = (body.email as string).trim().toLowerCase();
    const { name, username, password } = body;

    // Hash before inserting so a created user row always has a password.
    const hash = await bcrypt.hash(password, BCRYPT_ROUNDS);

    // Let the database's unique constraints arbitrate races — no
    // check-then-insert window.
    let user;
    try {
      [user] = await sql`
        INSERT INTO users (email, name, username)
        VALUES (${email}, ${name}, ${username})
        RETURNING id, email, name, username
      `;
      await sql`
        INSERT INTO user_passwords (user_id, password_hash)
        VALUES (${user.id}, ${hash})
      `;
    } catch (error) {
      if (isUniqueViolation(error)) {
        const message = String((error as Error).message);
        const conflict = message.includes("username")
          ? "This username is already taken"
          : "An account with this email already exists";
        return NextResponse.json({ error: conflict }, { status: 409 });
      }
      throw error;
    }

    return NextResponse.json({
      success: true,
      user: { id: user.id, email: user.email, name: user.name, username: user.username },
    });
  } catch (error) {
    console.error("Signup error:", error);
    return NextResponse.json({ error: "Failed to create account" }, { status: 500 });
  }
}
